/*!
    * Picture Tag Assembler v0.0.1
    * Plugin that attempts to generate a picture tag from a single image tag.
    *
    * Copyright 2024 Marshall Crosby
    * https://marshallcrosby.com
*/


/*
    TODOS:
    • Make dialog form element IDs unique
    ✓ Remove attributes on generated picture > img element
    • Bring in beautify.js and highlight.js javascript and css
    • Create and fire a modal with beautified/highlighted picture tag
    • Style '.picture-tag-assembler' panel
    ✓ Fix media attribute logic
    ✓ Figure out if iframe scrollbar is causing issues with returned image sizes
    • Figure out if lazy load is needed and it so re add the attribute
    • URL params like default breakpoints, and photo service
*/

// Highlight css and js CDN. Project repo: https://github.com/highlightjs/highlight.js/
const highlightVersionNumb = {
    css: '10.7.2',
    js: '11.3.1'
}
const themeCssDarkUrl = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/' + highlightVersionNumb.css + '/styles/atom-one-dark.min.css';
const themeCssLightUrl = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/' + highlightVersionNumb.css + '/styles/github.min.css';

const highlightCssUrl = (localStorage.getItem('checkedThemeColor') === null || localStorage.getItem('checkedThemeColor') === 'dark') ? themeCssDarkUrl : themeCssLightUrl;
const highlightScriptUrl = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/' + highlightVersionNumb.js + '/highlight.min.js';

// Beautify HTML CDN. Project repo: https://github.com/beautifier/beautifier.io
const beautifyVersionNumb = '1.14.0';
const beautifyScriptUrl = 'https://cdnjs.cloudflare.com/ajax/libs/js-beautify/' + beautifyVersionNumb + '/beautify-html.min.js';

// Load highlight js/css external assets
loadExternalCss(highlightCssUrl);

// Initialize everything after getting beautify-html script
loadExternalJs(beautifyScriptUrl, loadFinalJS);

function loadFinalJS() {
    loadExternalJs(highlightScriptUrl, console.log('loaded'));
}

function loadExternalJs(scriptSrc, callback) {
    const head = document.getElementsByTagName('head')[0];
    const doesItExist = head.querySelectorAll(`[src="${scriptSrc}"]`)[0];
    
    if (!doesItExist) {
        const script = document.createElement('script');
    
        script.src = scriptSrc;
        
        head.appendChild(script);
        script.onload = callback;
    }
}

// Run after getting beautify-html/highlight.io external assets
function loadExternalCss(url, callback) {
    const head = document.getElementsByTagName('head')[0];
    const doesItExist = head.querySelectorAll(`[href="${url}"]`)[0];

    if (!doesItExist) {
        const link = document.createElement('link');
            
        link.id = 'highlightJsCss';
        link.rel = 'stylesheet';
        link.href = url;
        
        link.onreadystatechange = callback;
        link.onload = callback;
        head.appendChild(link);
    }
}

const pictureTagAssemblerStyles = /* css */`
    :root,
    :host {
        --pta-border-radius-base: 8px;
    }

    .picture-tag-assembler {
        position: absolute;
        z-index: 2;
        background: white;
        padding: 15px;
        font-size: 10px;
        border-radius: var(--pta-border-radius-base);
    }

    .picture-tag-assembler__submit {
        padding: 6px 15px;
        background: white;
        border-radius: var(--pta-border-radius-base);
        background-color: #e3e3e3;
        text-align: center;
        cursor: pointer;
    }

    .picture-tag-assembler__form-group {
        margin-bottom: 10px;

        > * {
            display: block;
        }

        & input {
            padding-left: 10px;
            padding-right: 10px;
            border-radius: calc(var(--pta-border-radius-base) / 1.5);
            border: 1px solid #999;
        }
    }

    .picture-tag-assembler__modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate3d(-50%, -50%, 0);
        z-index: 10;
        border-radius: var(--pta-border-radius-base);
        padding: 0;
        overflow: hidden;

        & code,
        & pre {
            font-size: 10px;
            margin-bottom: 0;
        }
    }
`;

const styleTag = document.createElement('style');
styleTag.textContent = pictureTagAssemblerStyles;
document.head.appendChild(styleTag);

const infoModalMarkup = /* html */`
    <div class="picture-tag-assembler__modal-dialog">
        <div class="picture-tag-assembler__modal-body">
            <pre><code></code></pre>
        </div>
    </div>
`;

const modalElement = document.createElement('div');
modalElement.classList.add('picture-tag-assembler__modal');
modalElement.innerHTML = infoModalMarkup;
document.body.appendChild(modalElement);
const modalCodeElement = modalElement.querySelector('.picture-tag-assembler__modal code');

const infoDialogMarkup = /* html */`
    <div class="picture-tag-assembler__dialog">
        <div class="picture-tag-assembler__form-group">
            <label for="pictureTagAssemblerBreakpoints">Breakpoints</label>
            <input id="pictureTagAssemblerBreakpoints" type="text" placeholder="Breakpoints" value="576, 768, 992, 1200, 1600">
        </div>
        <div class="picture-tag-assembler__form-group">
            <label for="pictureTagAssemblerImageService">Image service</label>
            <input id="pictureTagAssemblerImageService" type="text" placeholder="Enter URL" value="https://picsum.photos">
        </div>
        <div class="picture-tag-assembler__submit" role="button" tabindex="0">Generate</div>
    </div>
`;

const allImageTags = document.querySelectorAll('[data-picture-tag-assembler]');
let ptaIndex = 0;

for (const imageTag of allImageTags) {
    imageTag.setAttribute('data-pta-index', ptaIndex);
    ptaIndex++;
}

const dialogPosition = (img, dialogEl) => {
    const imageRect = img.getBoundingClientRect();
    dialogEl.style.left = `${imageRect.left + window.scrollX + 25}px`;
    dialogEl.style.top = `${imageRect.top + window.scrollY + 25}px`;
};

const buildAndPlaceDialog = (el, imageIndex) => {
    const dialogElement = document.createElement('div');
    dialogElement.classList.add('picture-tag-assembler');
    dialogElement.innerHTML = infoDialogMarkup;
    document.body.appendChild(dialogElement);

    const submitButton = dialogElement.querySelector('.picture-tag-assembler__submit');
    submitButton.setAttribute('data-pta-associated-index', imageIndex);

    dialogPosition(el, dialogElement);

    submitButton.addEventListener('click', () => {
        const finalBreakpoints = dialogElement.querySelector('#pictureTagAssemblerBreakpoints').value;
        const finalService = dialogElement.querySelector('#pictureTagAssemblerImageService').value;
        pictureTagAssembler(`[data-pta-index="${imageIndex}"]`, finalBreakpoints, finalService);
    });
};

window.addEventListener('load', () => {
    allImageTags.forEach((image, index) => {
        buildAndPlaceDialog(image, index);
    });
});

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        let pictureTagAssemblerPanel = document.querySelectorAll('.picture-tag-assembler');
        
        pictureTagAssemblerPanel.forEach(item => {
            const imageToPositionToIndex = item.querySelector('.picture-tag-assembler__submit').getAttribute('data-pta-associated-index');
            const imageToPositionToElement = document.querySelector(`[data-pta-index="${imageToPositionToIndex}"]`);
            dialogPosition(imageToPositionToElement, item);
        });
    }, 200);
});

const pictureTagAssembler = (thisImage, breakpoints, service) => {

    const iframeMarkup = /* html */ `
        <iframe id="pictureTagAssemblerIframe" scrolling="no" src="${window. location. href}" frameborder="0" height="5000"></iframe>
    `;

    const hiddenIframeDiv = document.createElement('div');
    hiddenIframeDiv.style.width = '0';
    hiddenIframeDiv.style.height = '0';
    hiddenIframeDiv.style.overflow = 'hidden';
    hiddenIframeDiv.innerHTML = iframeMarkup;

    document.body.appendChild(hiddenIframeDiv);    

    const iframe = document.getElementById('pictureTagAssemblerIframe');
    const imageService = service;

    const getImageInfo = (loadedIFrameContent, imageSelector) => {
        const iframeDoc = loadedIFrameContent.contentDocument || loadedIFrameContent.contentWindow.document;
        iframeDoc.body.classList.add('js-no-pta');
        const image = iframeDoc.querySelector(imageSelector);

        if (image) {
            return {
                    imageTag: image,
                    iSrc: image.src,
                    dWidth: image.clientWidth,
                    dHeight: image.clientHeight
                }
        } else {
            console.log('Image not found in iframe.');
        }
    };

    const pictureTagGeneratedMarkup = document.createElement('picture');
    const finalBreakpoints = breakpoints;
    const viewportSizes = finalBreakpoints.split(',');

    const runThroughViewportSizes = (iframe) => {
        let pictureTagCreated = false;
        let lastSrcset = '';
    
        viewportSizes.forEach((size, index) => {
            const breakpointNum = parseInt(size);
            
            setTimeout(() => {
                iframe.setAttribute('width', breakpointNum - 1 + 'px');
                const { dWidth: imageWidth, dHeight: imageHeight, imageTag } = getImageInfo(iframe, thisImage);
                const serviceURL = `${imageService}/${imageWidth}/${imageHeight}?width=${imageWidth}&height=${imageHeight}`;
    
                // Generate <picture> tag if dWidth > 0 and hasn't been created
                if (imageWidth > 0 && !pictureTagCreated) {
                    const imageHTML = imageTag.outerHTML;
                    pictureTagGeneratedMarkup.innerHTML = `<picture>${imageHTML}</picture>`;
                    
                    const imageEl = pictureTagGeneratedMarkup.querySelector('img');
                    imageEl.setAttribute('width', imageWidth);
                    imageEl.setAttribute('height', imageHeight);
                    imageEl.setAttribute('src', serviceURL);
                    imageEl.removeAttribute('data-picture-tag-assembler');
                    imageEl.removeAttribute('data-pta-index');

                    lastSrcset = serviceURL;                    
                    pictureTagCreated = true;
                }
    
                // Add <source> tags for each viewport size
                if (imageWidth > 0 && pictureTagCreated) {
                    const sourceTag = document.createElement('source');
                    const mediaString = `(min-width: ${parseInt(viewportSizes[index - 1])}px)`;
    
                    if (lastSrcset !== serviceURL) {
                        sourceTag.setAttribute('srcset', serviceURL);
                        sourceTag.setAttribute('width', imageWidth);
                        sourceTag.setAttribute('height', imageHeight);
                        sourceTag.setAttribute('media', mediaString);
                        pictureTagGeneratedMarkup.querySelector('picture').prepend(sourceTag);
                    }
                    
                    lastSrcset = serviceURL;
                }
    
                // Final beautify and render on last iteration
                if (index === viewportSizes.length - 1) {
                    const pictureHTMLText = html_beautify(pictureTagGeneratedMarkup.innerHTML, { 
                        'indent_size': 4,
                        'preserve_newlines': true,
                        'max_preserve_newlines': 1,
                        'inline': ['span', 'b', 'i']
                    });
                    modalCodeElement.textContent = pictureHTMLText;
                    hljs.highlightElement(modalCodeElement);
                    hiddenIframeDiv.remove();
                }
            }, index * 300);
        });
    };
    

    iframe.addEventListener('load', () => {
        runThroughViewportSizes(iframe);
    });
}