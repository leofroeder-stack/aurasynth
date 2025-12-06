/**
 * Archive.org Library Fetcher
 * Fetches and parses MP3 files from archive.org collections
 * API Documentation: https://archive.org/developers/md-read.html
 */

export async function getLibrary() {
  const itemId = 'mozart_202006';
  const metadataUrl = `https://archive.org/metadata/${itemId}`;
  
  try {
    const response = await fetch(metadataUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if item exists
    if (!data.files || data.files.length === 0) {
      throw new Error('No files found in archive item');
    }
    
    // Filter for MP3 files based on format field and file extension
    const mp3Files = data.files.filter(file => 
      file.name && 
      file.format && 
      (file.format.includes('MP3') || file.name.toLowerCase().endsWith('.mp3'))
    );
    
    if (mp3Files.length === 0) {
      throw new Error('No MP3 files found in archive item');
    }
    
    // Map to required format with metadata
    const metadata = data.metadata || {};
    const library = mp3Files.map(file => ({
      title: file.title || file.name.replace(/\.mp3$/i, '').replace(/_/g, ' '),
      file: file.name,
      size: parseInt(file.size) || 0,
      url: `https://archive.org/download/${itemId}/${encodeURIComponent(file.name)}`,
      format: file.format,
      duration: parseFloat(file.length) || 0,
      artist: metadata.creator || metadata.artist || 'Wolfgang Amadeus Mozart',
      album: metadata.title || 'Mozart Collection'
    }));
    
    return library;
  } catch (error) {
    console.error('Error fetching archive library:', error);
    throw error;
  }
}