import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { format, parse } from 'date-fns';
import locale from 'date-fns/locale/ru';
import debounce from 'lodash/debounce';
import Mark from 'mark.js';
import Controller from '../base_controller';
import http from '../http-client';

export default class extends Controller {
  static targets = ['result', 'backdrop', 'scroll'];

  searchQuery;

  toggle() {
    this.element.classList.toggle('search-open');
  }

  initialize() {
    super.initialize();
    document.addEventListener('turbolinks:before-cache', () => {
      this.element.classList.remove('search-open');
    });
    this.Mark = new Mark(this.resultTarget);
  }

  closeFromBackdrop(e) {
    if (e.target === this.backdropTarget) {
      this.element.classList.remove('search-open');
    }
  }

  closeOnEscape(e) {
    let isEscape = false;
    if ('key' in e) {
      isEscape = (e.key === 'Escape' || e.key === 'Esc');
    } else {
      isEscape = (e.keyCode === 27);
    }
    if (isEscape) {
      this.toggle();
    }
  }

  makeSearchRequest = debounce(async (query) => {
    if (this.searchQuery !== query) return;
    const {data} = await http.get('https://radio-t.com/site-api/search', {params: {q: query}});
    if (this.searchQuery !== query) return;
    unmountComponentAtNode(this.resultTarget);
    this.scrollTarget.scrollTo(0, 0);
    render((<Results results={data}/>), this.resultTarget);
    this.Mark.mark(query);
    this.dispatchEvent(document, new CustomEvent('quicklink', {detail: {el: this.resultTarget}}));
  }, 300);

  async search(e) {
    this.searchQuery = e.target.value.trim();
    unmountComponentAtNode(this.resultTarget);
    if (this.searchQuery) this.makeSearchRequest(this.searchQuery);
  }
}

const Results = function ({results}) {
  return (
    <div className="page-search-list">{results.map((result) =>
      <a href={(new URL(result.url)).pathname} className="page-search-list-item py-3 px-3" key={result.url}>
        {result.image && <div className="podcast-cover">
          <div className="cover-image" style={{backgroundImage: `url('${result.image}')`}}/>
        </div>}
        <h4 className="m-0">{result.title}</h4>
        <div className="small text-muted">{format(parse(result.date), 'DD MMM YYYY', {locale})}</div>
        <div className="small">{result.show_notes}</div>
      </a>,
    )}</div>
  );
};
