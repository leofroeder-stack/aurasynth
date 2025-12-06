/**
 * Archive.org Library Fetcher
 * Fetches and parses MP3 files from archive.org collections
 * API Documentation: https://archive.org/developers/md-read.html
 */

export async function getLibraryFromIdentifier(identifier, useCache = true) {
  try {
    // Check cache first if enabled
    if (useCache) {
      const { base44 } = await import('@/api/base44Client');
      const cached = await base44.entities.ArchiveCache.filter({ identifier });
      if (cached.length > 0 && cached[0].tracks) {
        console.log('Using cached data for', identifier);
        return cached[0].tracks;
      }
    }
    
    const response = await fetch(`https://archive.org/metadata/${identifier}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const mp3Files = data.files.filter(file => 
      file.format === 'VBR MP3' || 
      (file.name && file.name.toLowerCase().endsWith('.mp3'))
    );
    
    const tracks = mp3Files.map(file => {
      const title = file.title || 
                   file.name.replace(/\.mp3$/i, '').replace(/_/g, ' ');
      
      return {
        url: `https://archive.org/download/${identifier}/${encodeURIComponent(file.name)}`,
        title: title,
        artist: data.metadata?.creator?.[0] || data.metadata?.artist?.[0] || 'Unknown Artist',
        album: data.metadata?.title || data.metadata?.album || 'Unknown Album',
        duration: parseFloat(file.length) || 0,
      };
    });
    
    // Cache the results
    if (useCache && tracks.length > 0) {
      const { base44 } = await import('@/api/base44Client');
      const existing = await base44.entities.ArchiveCache.filter({ identifier });
      if (existing.length > 0) {
        await base44.entities.ArchiveCache.update(existing[0].id, {
          metadata: data.metadata,
          tracks: tracks
        });
      } else {
        await base44.entities.ArchiveCache.create({
          identifier,
          metadata: data.metadata,
          tracks: tracks
        });
      }
    }
    
    return tracks;
  } catch (error) {
    console.error('Error fetching Archive.org library:', error);
    throw error;
  }
}

export function extractIdentifierFromUrl(url) {
  // Extract identifier from archive.org URLs
  // Examples:
  // https://archive.org/details/mozart_202006
  // https://archive.org/details/identifier123
  const match = url.match(/archive\.org\/details\/([^\/\?]+)/);
  return match ? match[1] : null;
}