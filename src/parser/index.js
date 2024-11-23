import { parseDialogue } from './dialogue.js';
import { parseFormat } from './format.js';
import { parseStyle } from './style.js';

function createNewSection(section, type) {
  return {
    section,
    type,
    body: [],
  };
}

export function parse(text) {
  const tree = {
    info: {},
    styles: { format: [], style: [] },
    events: { format: [], comment: [], dialogue: [] },
    sections: [],
  };
  const lines = text.split(/\r?\n/);
  let state = -1;
  tree.sections.push(createNewSection(undefined, 'unknown'));
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (/^\s*\[Script Info\]/i.test(line)) {
      state = 1;
      tree.sections.push(Object.assign({}, createNewSection('Script Info', 'info'), { info: tree.info }));
    } else if (/^\s*\[V4\+? Styles\]/i.test(line)) {
      state = 2;
      tree.sections.push(createNewSection('V4+ Styles', 'styles'));
    } else if (/^\s*\[Events\]/i.test(line)) {
      state = 3;
      tree.sections.push(createNewSection('Events', 'events'));
    } else {
      const match = /^\s*\[(.*)\]/.exec(line);
      if (match) {
        state = 0;
        tree.sections.push(Object.assign({}, createNewSection(match[1], 'info'), { info: {} }));
      }
    }

    const currentSection = tree.sections[tree.sections.length - 1];

    if (/^;/.test(line)) {
      currentSection.body.push({
        type: 'comment',
        line: line.slice(1),
      });
    }

    if (state === 0 || state === 1) {
      if (/:/.test(line)) {
        const [, key, value] = line.match(/(.*?)\s*:\s*(.*)/);
        currentSection.info[key] = value;
        currentSection.body.push({
          type: 'entry',
          key,
        });
      }
    }
    if (state === 2) {
      if (/^Format\s*:/i.test(line)) {
        const format = parseFormat(line);
        tree.styles.format = format;
        currentSection.format = format;
        currentSection.body.push({
          type: 'format',
          format,
        });
      }
      if (/^Style\s*:/i.test(line)) {
        const style = parseStyle(line, tree.styles.format);
        tree.styles.style.push(style);
        currentSection.body.push({
          type: 'entry',
          value: style,
        });
      }
    }
    if (state === 3) {
      if (/^Format\s*:/i.test(line)) {
        const format = parseFormat(line);
        tree.events.format = format;
        currentSection.format = format;
        currentSection.body.push({
          type: 'format',
          format,
        });
      }
      if (/^(?:Comment|Dialogue)\s*:/i.test(line)) {
        const [, key, value] = line.match(/^(\w+?)\s*:\s*(.*)/i);
        const dialogue = parseDialogue(value, tree.events.format);
        tree.events[key.toLowerCase()].push(dialogue);
        currentSection.body.push({
          type: 'entry',
          key: key.toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
          value: dialogue,
        });
      }
    }
  }

  tree.sections = tree.sections.filter((sec) => sec.section != null || sec.body.length !== 0);
  return tree;
}
