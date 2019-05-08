import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';

/**
 * `photo-rotate`
 * 
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class PhotoRotate extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
        label {
          width: 100%;
          display: block;
          min-height: 50px;
          border-radius: 3px;
          background-color: #5284CE;
          text-transform: uppercase;
          color: white;
          font-size: 16px;
          font-weight: 600;
          line-height: 50px;
          cursor: pointer;
          text-align: center;
        }
        input {
          width: 0.1px;
          height: 0.1px;
          opacity: 0;
          overflow: hidden;
          position: absolute;
          z-index: -1;
        }
        canvas {
          margin: 12px;
          border: 5px solid red;
        }
      </style>
      <label for="selfie">Take a selfie
        <input type="file" accept="image/*" id="selfie" on-change="_upload" capture="user">
      </label>
      <canvas id="canvas"></canvas>
    `;
  }
  static get properties() {
    return {
      debug: {
        type: Boolean,
        value: false,
      },
      maxsize: {
        type: Number,
        value: 800,
      },
    };
  }
  _upload(e) {
    if (e && e.target && e.target.id) {
      const target = e.target.id;
      const file = this.shadowRoot.querySelector(`#${target}`).files[0];
      if (file.type.match(/image.*/)) {
        const reader = new FileReader();
        this._getOrientation(file, (orientation) => {
          reader.onload = (readerEvent) => {
            const image = new Image();
            image.onload = () => {
              let canvas;
              if (!this.debug){
                canvas = document.createElement('canvas');
              } else {
                canvas = this.shadowRoot.querySelector(`#canvas`)
              }
              const maxSize = this.maxsize;
              let width = image.width;
              let height = image.height;
              if (width > height) {
                if (width > maxSize) {
                  height *= maxSize / width;
                  width = maxSize;
                }
              } else {
                if (height > maxSize) {
                  width *= maxSize / height;
                  height = maxSize;
                }
              }
              if (orientation === 6) {
                canvas.width = height;
                canvas.height = width;
                const ctx = canvas.getContext('2d')
                ctx.clearRect(0,0,canvas.width,canvas.height);
                ctx.save();
                ctx.translate(canvas.width/2, canvas.height/2);
                ctx.rotate(90*Math.PI/180);
                ctx.drawImage(image, -width/2, -height/2, width, height);
                ctx.restore();
              } else {
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d')
                ctx.drawImage(image, 0, 0, width, height);
              }
              const dataUrl = canvas.toDataURL('image/jpeg');
              const imageToUpload = this._dataURLToBlob(dataUrl);
            };
            image.src = readerEvent.target.result;
          };
        });
        reader.readAsDataURL(file);
      }
    }
  }

  _getOrientation(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
        var view = new DataView(e.target.result);
        if (view.getUint16(0, false) != 0xFFD8) {
            return callback(-2);
        }
        var length = view.byteLength, offset = 2;
        while (offset < length) {
            if (view.getUint16(offset+2, false) <= 8) return callback(-1);
            var marker = view.getUint16(offset, false);
            offset += 2;
            if (marker == 0xFFE1) {
                if (view.getUint32(offset += 2, false) != 0x45786966) {
                    return callback(-1);
                }
                var little = view.getUint16(offset += 6, false) == 0x4949;
                offset += view.getUint32(offset + 4, little);
                var tags = view.getUint16(offset, little);
                offset += 2;
                for (var i = 0; i < tags; i++){
                    if (view.getUint16(offset + (i * 12), little) == 0x0112) {
                        return callback(view.getUint16(offset + (i * 12) + 8, little));
                    }
                }
            }
            else if ((marker & 0xFF00) != 0xFF00) {
                break;
            }
            else { 
                offset += view.getUint16(offset, false);
            }
        }
        return callback(-1);
    };
    reader.readAsArrayBuffer(file);
}

  _dataURLToBlob(dataURL) {
    const BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
      const parts = dataURL.split(',');
      const contentType = parts[0].split(':')[1];
      const raw = parts[1];
      return new Blob([raw], {type: contentType});
    }
    const parts = dataURL.split(BASE64_MARKER);
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], {type: contentType});
  }
} window.customElements.define('photo-rotate', PhotoRotate);
