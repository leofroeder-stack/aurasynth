/**
 * Archive.org Library Fetcher
 * Fetches and parses MP3 files from archive.org collections
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
    
    // Filter for MP3 files only
    const mp3Files = (data.files || []).filter(file => 
      file.name && file.name.toLowerCase().endsWith('.mp3')
    );
    
    // Map to required format
    const library = mp3Files.map(file => ({
      title: file.title || file.name.replace(/\.mp3$/i, '').replace(/_/g, ' '),
      file: file.name,
      size: file.size || 0,
      url: `https://archive.org/download/${itemId}/${file.name}`
    }));
    
    return library;
  } catch (error) {
    console.error('Error fetching archive library:', error);
    throw error;
  }
}