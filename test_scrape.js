import * as cheerio from 'cheerio';

async function scrape() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch('https://tech12h.com/bai-hoc/trac-nghiem-khtn-8-ket-noi-bai-1-su-dung-mot-so-hoa-chat-thiet-bi-co-ban-trong-phong-thi.html');
  const text = await res.text();
  const $ = cheerio.load(text);
  
  // Find where questions are
  let out = '';
  $('*').each((i, el) => {
    if($(el).text().includes('Câu 1:') && $(el).text().length < 500 && !$(el).children().length) {
       out += 'Found Câu 1 in tag: ' + el.tagName + ' class: ' + $(el).attr('class') + '\n';
    }
  });
  console.log(out);
  
  // Print some content that has Câu 1
  console.log($('p:contains("Câu 1:")').parent().html()?.substring(0, 1000));
}
scrape();
