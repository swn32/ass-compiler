/* eslint-disable no-nested-ternary */
export function stringifyInfo(info) {
  return Object.keys(info).map((key) => `${key}: ${info[key]}`).join('\n');
}

function pad00(n) {
  return `00${n}`.slice(-2);
}

export function stringifyTime(tf) {
  const t = Number.parseFloat(tf.toFixed(2));
  const ms = t.toFixed(2).slice(-2);
  const s = (t | 0) % 60;
  const m = (t / 60 | 0) % 60;
  const h = t / 3600 | 0;
  return `${h}:${pad00(m)}:${pad00(s)}.${ms}`;
}

export function stringifyEffect(eff) {
  if (!eff) return '';
  if (eff.name === 'banner') {
    return `Banner;${eff.delay};${eff.leftToRight};${eff.fadeAwayWidth}`;
  }
  if (/^scroll\s/.test(eff.name)) {
    return `${eff.name.replace(/^\w/, (x) => x.toUpperCase())};${eff.y1};${eff.y2};${eff.delay};${eff.fadeAwayHeight}`;
  }
  return eff.name;
}

export function stringifyDrawing(drawing) {
  return drawing.map((cmds) => cmds.join(' ')).join(' ');
}

export function stringifyTag(tag) {
  const [key] = Object.keys(tag);
  if (!key) return '';
  const _ = tag[key];
  if (['pos', 'org', 'move', 'fad', 'fade'].some((ft) => ft === key)) {
    return `\\${key}(${_})`;
  }
  if (/^[ac]\d$/.test(key)) {
    return `\\${key[1]}${key[0]}&H${_}&`;
  }
  if (key === 'alpha') {
    return `\\alpha&H${_}&`;
  }
  if (key === 'clip') {
    return `\\${_.inverse ? 'i' : ''}clip(${
      _.dots || `${_.scale === 1 ? '' : `${_.scale},`}${stringifyDrawing(_.drawing)}`
    })`;
  }
  if (key === 't') {
    return `\\t(${[_.t1, _.t2, _.accel, _.tags.map(stringifyTag).join('')]})`;
  }
  return `\\${key}${_}`;
}

export function stringifyText(Text) {
  return Text.parsed.map(({ tags, text, drawing }) => {
    const tagText = tags.map(stringifyTag).join('');
    const content = drawing.length ? stringifyDrawing(drawing) : text;
    return `${tagText ? `{${tagText}}` : ''}${content}`;
  }).join('');
}

export function stringifyEvent(event, format) {
  return format.map((fmt) => {
    switch (fmt) {
      case 'Start':
      case 'End':
        return stringifyTime(event[fmt]);
      case 'MarginL':
      case 'MarginR':
      case 'MarginV':
        return event[fmt] || '0';
      case 'Effect':
        return stringifyEffect(event[fmt]);
      case 'Text':
        return stringifyText(event.Text);
      default:
        return event[fmt];
    }
  }).join();
}

export function stringify({ sections }) {
  return sections.map((section) => [
    ...section.section != null ? [`[${section.section}]`] : [],
    ...section.body.map((entry) => [
      entry.type === 'comment'
        ? `;${entry.line}`
        : entry.type === 'format'
          ? `Format: ${entry.format.join(', ')}`
          : entry.type === 'entry'
            ? section.type === 'info'
              ? `${entry.key}: ${section.info[entry.key]}`
              : section.type === 'styles'
                ? `Style: ${section.format.map((fmt) => entry.value[fmt]).join()}`
                : section.type === 'events'
                  ? `${entry.key}: ${stringifyEvent(entry.value, section.format)}`
                  : undefined
            : undefined,
    ]),
    '',
  ].join('\n')).join('\n');
}
