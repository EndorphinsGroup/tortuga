/** Builds the /faq/ question list: resolves `from` references to the page data files and adds anchors. */
import page from '../data/faq-page.json';
import general from '../data/faq.json';
import lessons from '../data/lessons.json';
import courses from '../data/courses.json';
import plankton from '../data/plankton.json';
import beach from '../data/beach.json';

type QA = { q: string; a: string };
export type FaqItem = QA & { id: string; link?: { label: string; href: string } };
export type FaqGroup = { id: string; title: string; items: FaqItem[] };

const sources: Record<string, QA[]> = {
  general, lessons: lessons.faq, courses: courses.faq, plankton: plankton.faq, beach: beach.faq,
};

const map: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
};
export const slug = (s: string) =>
  s.toLowerCase().split('').map((c) => map[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 7).join('-');

export function faqGroups(): FaqGroup[] {
  const used = new Set<string>();
  return page.groups.map((g) => ({
    id: g.id,
    title: g.title,
    items: g.items.map((it: any) => {
      let a = it.a;
      if (it.from) {
        const found = sources[it.from]?.find((x) => x.q === it.q);
        if (!found) throw new Error(`faq-page.json: вопрос «${it.q}» не найден в ${it.from}`);
        a = found.a;
      }
      let id = slug(it.q);
      while (used.has(id)) id += '-2';
      used.add(id);
      return { q: it.q, a, id, link: it.link };
    }),
  }));
}
