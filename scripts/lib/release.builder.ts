export class ReleaseBuilder {
    release: any = null;
    currentText = '';
  
    start(id: string) {
      this.release = {
        releaseId: id,
        labelName: null,
        labelCatNo: null,
        genres: [],
        styles: [],
        country: null,
        name: null,
        notes: null,
      };
    }
  
    resetText() {
      this.currentText = '';
    }
  
    addText(text: string) {
      this.currentText += text;
    }
  
    getText() {
      return this.currentText.trim();
    }
  
    isActive() {
      return this.release !== null;
    }
  
    finish() {
      const r = this.release;
      this.release = null;
      return r;
    }
  }