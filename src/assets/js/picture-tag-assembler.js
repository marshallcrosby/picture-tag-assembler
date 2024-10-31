/*!
    * Picture Tag Assembler v0.0.1
    * Plugin that attempts to generate a picture tag from a single image tag.
    *
    * Copyright 2024 Marshall Crosby
    * https://marshallcrosby.com
*/


/*
    TODOS:
    ✓ Make dialog form element IDs unique
    ✓ Remove attributes on generated picture > img element
    • Bring in beautify.js and highlight.js javascript and css if needed
    • Create and fire a modal with beautified/highlighted picture tag
    • Style '.picture-tag-assembler' panel
    ✓ Fix media attribute logic
    • Figure out if iframe scrollbar is causing issues with returned image sizes
    • Figure out if lazy load is needed and if so re-add the attribute
    • URL params like default breakpoints, and photo service
    • Keyboard focus out of dialog closes it
    • Use image url as Service url setting
    • Cache input settings
*/

const allImageTags = document.querySelectorAll('img');
let ptaIndex = 0;

for (const imageTag of allImageTags) {
    imageTag.setAttribute('data-pta-index', ptaIndex);
    ptaIndex++;
}

let ptaParams;
const pictureTagAssemblerScriptTag = document.querySelectorAll('script[src*="picture-tag-assembler."]')[0];
if (pictureTagAssemblerScriptTag) {
    const pictureTagAssemblerURLParam = new URLSearchParams(pictureTagAssemblerScriptTag.getAttribute('src').split('?')[1]);
    
    ptaParams = {
        defaultBreakpoints: pictureTagAssemblerURLParam.get('default-breakpoints')
    }
}

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
        --pta-color-primary: #1e2127;
        --pta-border-radius-base: 8px;
        --pta-fs: 11px;
        --pta-ff-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
    }

    .js-pta-p-key-pressed *:not(img) {
        pointer-events: none;

        img {
            pointer-events: auto;
        }
    }

    .picture-tag-assembler {
        width: 200px;
        position: absolute;
        z-index: 2;
        background: white;
        padding: 12px;
        font-size: var(--pta-fs);
        border-radius: var(--pta-border-radius-base);
        box-shadow: 0 19px 38px rgba(0, 0, 0, .4);
        outline: none !important;
    }

    .picture-tag-assembler__title {
        position: relative;
        z-index: 0;
        overflow: hidden;
        padding-right: 40px;
        white-space: nowrap;
        font-family: var(--pta-ff-primary);
        font-size: 1.16666em;
        font-weight: 600;

        margin-bottom: 10px;
    }

    .picture-tag-assembler__submit {
        padding: 6px 20px;
        background: white;
        border-radius: 30px;
        background-color: #343944;
        border: 1px solid #343944;
        text-align: center;
        cursor: pointer;
        height: 34px;
        align-content: center;
        font-family: var(--pta-ff-primary);
        font-size: var(--pta-fs);
        position: relative;
        overflow: hidden;
        line-height: 1.3;
        font-weight: 400;
        color: white;
    }

    .picture-tag-assembler__submit-loader {
        display: block;
        width: 100%;
        height: 3px;
        position: absolute;
        background: rgba(255, 255, 255, .2);
        border-radius: 6px;
        overflow: hidden;
        left: 0;
        bottom: 0;

        &:after {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            right: 100%;
            top: 0;
            background: rgba(255, 255, 255, .2);
            border-radius: 6px;
            animation: pta_loader 2000ms infinite;
        }
    }

    @keyframes pta_loader {
        100% {
            transform: translateX(200%);
        }
    }

    .picture-tag-assembler__submit-generating {
        display: none;
    }

    .js-pta--in-progress {
        .picture-tag-assembler__submit {
            pointer-events: none;
        }

        .picture-tag-assembler__submit-generating {
            display: block;
        }

        .picture-tag-assembler__submit-initial {
            display: none;
        }
    }

    .picture-tag-assembler__form-group {
        margin-bottom: 10px;

        > * {
            display: block;
        }

        & label {
            font-family: var(--pta-ff-primary);
        }

        & textarea,
        & input {
            padding-left: 8px;
            padding-right: 8px;
            border-radius: calc(var(--pta-border-radius-base) / 1.5);
            border: 1px solid #999 !important;
            font-family: var(--pta-ff-primary);
            font-size: var(--pta-fs);
            box-shadow: none;
            width: 100%;
        }

        & p {
            margin-top: 2px;
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

    body:has(.js-pta--in-progress) {
        .picture-tag-assembler__modal {
            display: none;
        }
    }

    .picture-tag-assembler-iframe-container {
        top: 0;
        left: 0;
        z-index: 100000;
        position: fixed;
        width: 100%;
        height: 100vh;
        border: 10px solid red;
        opacity: .75;
        
        > * {
            filter: grayscale(1);
        }
    }

    /*.picture-tag-assembler-iframe-container {
        width: 0;
        height: 0;
        overflow: hidden;
    }*/
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
const ptaBreakpoints = (ptaParams.defaultBreakpoints) ? ptaParams.defaultBreakpoints.replace(' ', '').split(',').join(', ') : '576,  768, 992, 1200, 1600';

const infoDialogMarkup = /* html */`
    <div class="picture-tag-assembler__dialog">
        <div class="picture-tag-assembler__title">Picture Tag Assembler</div>
        <div class="picture-tag-assembler__form-group">
            <label for="pictureTagAssemblerBreakpoints"><strong>Breakpoints:</strong></label>
            <textarea id="pictureTagAssemblerBreakpoints" placeholder="Breakpoints">${ptaBreakpoints}</textarea>
            <p>Comma separated numbers, px only.</p>
        </div>
        <div class="picture-tag-assembler__form-group">
            <label for="pictureTagAssemblerImageService"><strong>Image service:</strong></label>
            <input id="pictureTagAssemblerImageService" type="text" placeholder="Enter URL" value="https://picsum.photos">
        </div>
        <div class="picture-tag-assembler__submit" role="button" tabindex="0">
            <span class="picture-tag-assembler__submit-initial">Generate</span>
            <span class="picture-tag-assembler__submit-generating">
                <span class="picture-tag-assembler__visually-hidden">Generating &lt;picture&gt;</span>
                <span class="picture-tag-assembler__submit-loader"></span>
            </span>
        </div>
    </div>
`;

const positionDialogTopMousePointer = (dialogEl, event) => {
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    const pointerX = mouseX + window.scrollX;
    const pointerY = mouseY + window.scrollY;

    dialogEl.style.left = `${pointerX - 10}px`;
    dialogEl.style.top = `${pointerY - 10}px`;
};

const buildAndPlaceDialog = (el, imageIndex, event) => {
    const dialogElement = document.createElement('div');
    dialogElement.setAttribute('tabindex', '-1');
    dialogElement.classList.add('picture-tag-assembler');
    dialogElement.innerHTML = infoDialogMarkup;
    document.body.appendChild(dialogElement);

    const submitButton = dialogElement.querySelector('.picture-tag-assembler__submit');
    submitButton.setAttribute('data-pta-associated-index', imageIndex);
    
    positionDialogTopMousePointer(dialogElement, event);
    
    dialogElement.focus();
    
    submitButton.addEventListener('click', (e) => {
        const finalBreakpoints = dialogElement.querySelector('#pictureTagAssemblerBreakpoints').value;
        const finalService = dialogElement.querySelector('#pictureTagAssemblerImageService').value;
        
        pictureTagAssembler(`[data-pta-index="${imageIndex}"]`, finalBreakpoints, finalService);
        
        e.target.closest('.picture-tag-assembler').classList.add('js-pta--in-progress');
    });
};

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        let pictureTagAssemblerPanel = document.querySelectorAll('.picture-tag-assembler');
        
        pictureTagAssemblerPanel.forEach(item => {
            const imageToPositionToIndex = item.querySelector('.picture-tag-assembler__submit').getAttribute('data-pta-associated-index');
            const imageToPositionToElement = document.querySelector(`[data-pta-index="${imageToPositionToIndex}"]`);
            positionDialogTopMousePointer(imageToPositionToElement, item);
        });
    }, 200);
});

const pictureTagAssembler = (thisImage, breakpoints, service) => {

    const iframeMarkup = /* html */ `
        <iframe id="pictureTagAssemblerIframe" scrolling="no" src="${window. location. href}" frameborder="0" height="5000"></iframe>
    `;

    const hiddenIframeDiv = document.createElement('div');
    hiddenIframeDiv.classList.add('picture-tag-assembler-iframe-container')
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
                const {
                    dWidth: imageWidth,
                    dHeight: imageHeight,
                    imageTag
                } = getImageInfo(iframe, thisImage);
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
                    document.querySelector('.js-pta--in-progress').classList.remove('js-pta--in-progress');

                    const currentDialog = document.querySelector('.picture-tag-assembler');
                    
                    if (currentDialog) {
                        currentDialog.remove();
                    }
                }
            }, index * 600);
        });
    };

    iframe.addEventListener('load', () => {
        runThroughViewportSizes(iframe);
    });
}

let isPKeyPressed = false;
document.addEventListener('keydown', (event) => {
    if (event.key === 'p' || event.key === 'P') {
        isPKeyPressed = true;
        document.body.classList.add('js-pta-p-key-pressed');
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'p' || event.key === 'P') {
        isPKeyPressed = false;
        document.body.classList.remove('js-pta-p-key-pressed');
    }
});

document.addEventListener('click', (event) => {
    const currentDialog = document.querySelector('.picture-tag-assembler');
    
    if (isPKeyPressed) {
        event.preventDefault();
        event.stopPropagation();

        
        if (currentDialog) {
            currentDialog.remove();
        }
        
        const x = event.clientX;
        const y = event.clientY;
        const targetElement = document.elementFromPoint(x, y);

        if (targetElement && targetElement.tagName === 'IMG') {
            const targetIndex = event.target.getAttribute('data-pta-index');
            buildAndPlaceDialog(event.target, targetIndex, event);
        }
    };

    if (!event.target.closest('.picture-tag-assembler')) {
        if (currentDialog) {
            currentDialog.remove();
        }
    };
});
