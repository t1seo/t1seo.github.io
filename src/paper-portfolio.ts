import './paper-portfolio.css';

interface PortfolioOptions {
  onBack: () => void;
}

const projects = [
  {
    number: '01', title: 'Quiet Notes', category: 'Local-first writing application', year: '2026',
    description: 'A browser-based workspace for writing, organizing, and finding notes. The project focuses on reliable local storage, fast search, and a keyboard-accessible editor.',
    tags: ['TypeScript', 'Local-first', 'Interface design'],
    brief: 'Design a writing workflow that works offline and keeps saved content easy to retrieve.',
    approach: 'Separate the editor, persistence layer, and search index. Define recoverable error states and support the full workflow with keyboard navigation.',
    deliverable: 'A responsive editor, searchable notes, local persistence, and a portable export format.',
  },
  {
    number: '02', title: 'Seasonal Studio', category: 'Interactive web experience', year: '2026',
    description: 'A personal website with scenes that respond to time, seasons, and user input. The work brings together responsive layouts, animation, and accessible controls.',
    tags: ['Creative development', 'CSS', 'Accessible motion'],
    brief: 'Create an expressive landing page while keeping navigation and interaction predictable.',
    approach: 'Model the environment as explicit state, compose independent visual layers, and provide keyboard alternatives and reduced-motion behavior.',
    deliverable: 'A responsive scene system, time and season controls, and a collection of object interactions.',
  },
  {
    number: '03', title: 'Developer Toolbox', category: 'Browser-based developer utilities', year: '2025',
    description: 'A collection of focused tools for formatting and checking everyday development inputs. Each utility prioritizes clear validation, useful error messages, and easy copying.',
    tags: ['Web platform', 'Developer experience', 'Testing'],
    brief: 'Make routine text transformations available in a consistent, lightweight interface.',
    approach: 'Use shared input and output patterns, validate data before processing, and cover malformed inputs with focused tests. Keep processing in the browser.',
    deliverable: 'A JSON formatter, text comparison view, and color converter with reusable interface components.',
  },
];

/** A self-contained, scrollable second page. All experience and project copy is explicitly a sample. */
export function mountPaperPortfolio(container: HTMLElement, { onBack }: PortfolioOptions): { destroy(): void } {
  const root = document.createElement('main');
  root.className = 'paper-portfolio';
  root.lang = 'en';
  root.setAttribute('aria-label', 'Jieun Jeon — sample portfolio');
  root.innerHTML = `
    <div class="paper-portfolio-sheet">
      <header class="paper-portfolio-header">
        <button type="button" class="paper-portfolio-back" data-portfolio-back><span aria-hidden="true">←</span> Back to the studio</button>
        <span class="paper-portfolio-edition">PORTFOLIO <span aria-hidden="true">/</span> 2026</span>
      </header>

      <div class="paper-portfolio-sample">Sample portfolio — projects and experience are placeholder content.</div>

      <section class="paper-portfolio-hero" aria-labelledby="paper-portfolio-title">
        <div class="paper-portfolio-identity">
          <img src="/assets/badge/jieun-mark.svg" width="42" height="42" alt="" draggable="false" />
          <p><strong>JIEUN.AI</strong><span>Engineering & development</span></p>
        </div>
        <h1 id="paper-portfolio-title" tabindex="-1">Jieun Jeon<span>Software Engineer.</span></h1>
        <div class="paper-portfolio-hero-bottom">
          <p>Web applications, developer tools,<br />and considered digital experiences.</p>
          <nav aria-label="Portfolio sections">
            <button type="button" data-portfolio-scroll="work">Selected work <span aria-hidden="true">↓</span></button>
            <button type="button" data-portfolio-scroll="about">About <span aria-hidden="true">↓</span></button>
            <button type="button" data-portfolio-scroll="experience">Experience <span aria-hidden="true">↓</span></button>
          </nav>
        </div>
      </section>

      <section class="paper-portfolio-section paper-portfolio-work" data-portfolio-section="work" aria-labelledby="paper-portfolio-work-title">
        <div class="paper-portfolio-section-heading"><h2 id="paper-portfolio-work-title" tabindex="-1">Selected work</h2><span>2025 — 2026</span></div>
        <div class="paper-portfolio-projects">
          ${projects.map((project) => `
            <article class="paper-portfolio-project">
              <span class="paper-portfolio-project-number" aria-hidden="true">${project.number}</span>
              <div class="paper-portfolio-project-content">
                <div class="paper-portfolio-project-heading"><h3>${project.title}</h3><span>${project.year}</span></div>
                <p class="paper-portfolio-category">${project.category}</p>
                <p class="paper-portfolio-description">${project.description}</p>
                <ul class="paper-portfolio-tags" aria-label="${project.title} technologies and focus">${project.tags.map((tag) => `<li>${tag}</li>`).join('')}</ul>
                <details class="paper-portfolio-project-details">
                  <summary><span>View ${project.title} details</span><span class="paper-portfolio-plus" aria-hidden="true">+</span></summary>
                  <div class="paper-portfolio-project-notes">
                    <div><h4>The brief</h4><p>${project.brief}</p></div>
                    <div><h4>The approach</h4><p>${project.approach}</p></div>
                    <div><h4>Deliverables</h4><p>${project.deliverable}</p></div>
                  </div>
                </details>
              </div>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="paper-portfolio-section paper-portfolio-about" data-portfolio-section="about" aria-labelledby="paper-portfolio-about-title">
        <div class="paper-portfolio-section-heading"><h2 id="paper-portfolio-about-title" tabindex="-1">About</h2><span>APPROACH & FOCUS</span></div>
        <div class="paper-portfolio-about-layout">
          <p class="paper-portfolio-about-lead">Engineering with<br />a product perspective.</p>
          <div class="paper-portfolio-about-copy">
            <p>I’m interested in building useful web software with clear interfaces and maintainable foundations. My focus spans application development, developer experience, and interaction design.</p>
            <p>I value readable code, accessible defaults, and decisions grounded in how people use a product. I approach new work by clarifying the problem, building a focused solution, and testing the details.</p>
            <ul class="paper-portfolio-tags" aria-label="Areas of focus"><li>TypeScript</li><li>Web interfaces</li><li>Accessibility</li><li>Design systems</li></ul>
          </div>
        </div>
      </section>

      <section class="paper-portfolio-section paper-portfolio-experience" data-portfolio-section="experience" aria-labelledby="paper-portfolio-experience-title">
        <div class="paper-portfolio-section-heading"><h2 id="paper-portfolio-experience-title" tabindex="-1">Experience</h2><span>ENGINEERING & PRODUCT</span></div>
        <div class="paper-portfolio-experience-row"><div><h3>Product team</h3><span>Software Engineer</span></div><p>Developing product interfaces, collaborating with design, and improving core user flows. Areas of responsibility include component architecture, accessibility, and application testing.</p></div>
        <div class="paper-portfolio-experience-row"><div><h3>Independent projects</h3><span>Design & Development</span></div><p>Building web tools and interactive prototypes from initial requirements to implementation. Focused on technical exploration, clear documentation, and reusable solutions.</p></div>
      </section>

      <footer class="paper-portfolio-footer">
        <div><p>Jieun Jeon<span>Software Engineer</span></p><button type="button" class="paper-portfolio-back" data-portfolio-back><span aria-hidden="true">←</span> Back to the studio</button></div>
        <div class="paper-portfolio-colophon"><img src="/assets/badge/jieun-mark.svg" width="30" height="30" alt="" draggable="false" /><span>JIEUN.AI<br />PORTFOLIO</span></div>
      </footer>
    </div>
  `;
  container.append(root);
  const abort = new AbortController();
  let destroyed = false;

  root.addEventListener('click', (event) => {
    if (destroyed || !(event.target instanceof Element)) return;
    if (event.target.closest('[data-portfolio-back]')) {
      onBack();
      return;
    }
    const target = event.target.closest<HTMLButtonElement>('[data-portfolio-scroll]');
    if (!target) return;
    const section = root.querySelector<HTMLElement>(`[data-portfolio-section="${target.dataset.portfolioScroll}"]`);
    if (!section) return;
    section.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    const quiet = window.matchMedia('(prefers-reduced-motion: reduce)').matches || container.closest('[data-motion="off"]') !== null;
    root.scrollTo({ top: section.offsetTop - 30, behavior: quiet ? 'instant' : 'smooth' });
  }, { signal: abort.signal });

  root.querySelector<HTMLElement>('h1')!.focus({ preventScroll: true });

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      abort.abort();
      root.remove();
    },
  };
}
