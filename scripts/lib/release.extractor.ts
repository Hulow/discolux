import { ReleaseBuilder } from "./release.builder";

interface SaxNode {
    name: string;
    attributes: Record<string, string>;
  }
  
  export class ReleaseExtractor {
    constructor(private builder: ReleaseBuilder) {}
  
    onOpenTag(node: SaxNode) {
      this.builder.resetText();
  
      if (node.name === 'release') {
        this.builder.start(node.attributes.id);
      }
  
      if (node.name === 'label' && this.builder.isActive()) {
        const r = this.builder.release;
  
        if (!r.labelName) {
          r.labelName = node.attributes.name;
          r.labelCatNo = node.attributes.catno;
        }
      }
    }
  
    onText(text: string) {
      if (!this.builder.isActive()) return;
      this.builder.addText(text);
    }
  
    onCloseTag(tagName: string) {
      if (!this.builder.isActive()) return;
  
      const r = this.builder.release;
      const text = this.builder.getText();
  
      switch (tagName) {
        case 'genre':
          if (text) r.genres.push(text);
          break;
  
        case 'style':
          if (text) r.styles.push(text);
          break;
  
        case 'country':
          r.country = text || null;
          break;
  
        case 'name':
          if (!r.name) r.name = text;
          break;
  
        case 'notes':
          r.notes = text || null;
          break;
  
        case 'release': {
          const done = this.builder.finish();
          if (done.genres.includes('Electronic')) {
            console.log(done);
          }
          break;
        }
      }
    }
  }