import ytSearch from 'yt-search';

async function testEmbed() {
   const ids = ["R5tLIPamTKA", "VX-6X6ZsSrA"];
   for (const id of ids) {
       try {
           const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
           if (res.ok) {
               console.log(id, "is embeddable!");
           } else {
               console.log(id, "is NOT embeddable (status:", res.status, ")");
           }
       } catch (e) {
           console.log(id, "error fetching oembed");
       }
   }
}

testEmbed();
