import { proxyFetch } from './src/lib/spotifyClient';

async function test() {
  const data = await proxyFetch('/me/tracks?limit=2');
  console.log(JSON.stringify(data, null, 2));
}

test();
