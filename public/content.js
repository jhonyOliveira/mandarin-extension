async function loadWords() {
  const res = await fetch(chrome.runtime.getURL("words.json"));
  return new Set((await res.json()).map(w => w.toLowerCase()));
}

function walk(node, cb) {
  if (node.nodeType === 3) cb(node);
  else node.childNodes.forEach(n => walk(n, cb));
}

function normalize(w) {
  return w.toLowerCase().replace(/[^a-z']/g, "");
}

async function main() {
  const wordsSet = await loadWords();
  let total = 0, known = 0;
  const freq = {};

  walk(document.body, node => {
    const text = node.nodeValue;

    const replaced = text.replace(/\b[\w']+\b/g, (word) => {
      const norm = normalize(word);
      if (!norm) return word;

      total++;
      freq[norm] = (freq[norm] || 0) + 1;
      if (wordsSet.has(norm)) known++;

      if (wordsSet.has(norm)) {
        return `<span class="highlight">${word}</span>`;
      }
      return word;
    });

    if (replaced !== text) {
      const wrapper = document.createElement("span");
      wrapper.innerHTML = replaced;

      const frag = document.createDocumentFragment();
      while (wrapper.firstChild) {
        frag.appendChild(wrapper.firstChild);
      }

      node.replaceWith(frag);
    }
  });

  // cobertura
  let coverage = known / total;

  // palavras desconhecidas ordenadas por frequência
  const unknown = Object.entries(freq)
    .filter(([w]) => !wordsSet.has(w))
    .sort((a, b) => b[1] - a[1]);

  // simulação até 90%
  let needed = 0;
  let temp = coverage;

  for (let [w, count] of unknown) {
    temp += count / total;
    needed++;
    if (temp >= 0.9) break;
  }

  // UI simples
  const box = document.createElement("div");
  box.style = "position:fixed;bottom:10px;right:10px;background:#fff;padding:10px;border:1px solid #ccc;z-index:9999;font-size:14px;";
  box.innerText =
    `Coverage: ${(coverage * 100).toFixed(1)}%\n` +
    `To 90%: ${needed} words`;

  document.body.appendChild(box);
}

main();