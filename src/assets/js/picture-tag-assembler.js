/*!
    * Picture Tag Assembler v0.0.2
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

const queryParamTestString = 'https://example.com?breakpoints=576,768,992,1200,1600,1920,2560&placeholder-service=https://picsum.photos';

const allImageTags = document.querySelectorAll('img');
let ptaIndex = 0;

for (const imageTag of allImageTags) {
    imageTag.setAttribute('data-pta-index', ptaIndex);
    ptaIndex++;
}

window.addEventListener('load', () => {
    let ptaParams = {
        breakpoints: null,
        imageService: null,
        pixelDensity: null
    }

    //const pictureTagAssemblerScriptTag = document.querySelectorAll('script[src*="picture-tag-assembler."]')[0];
    //if (pictureTagAssemblerScriptTag) {
        //const pictureTagAssemblerURLParam = new URLSearchParams(pictureTagAssemblerScriptTag.getAttribute('src').split('?')[1]);


        //ptaParams = {
            //breakpoints: pictureTagAssemblerURLParam.get('breakpoints'),
            //imageService: pictureTagAssemblerURLParam.get('placeholder-service'),
            //pixelDensity: pictureTagAssemblerURLParam.get('pixel-density')
        //}
    //}


    // const pictureTagAssemblerURLParam = new URLSearchParams(pictureTagAssemblerScriptTag.getAttribute('src').split('?')[1]);
    const pictureTagAssemblerURLParam = new URLSearchParams(queryParamTestString.split('?')[1]);

    ptaParams = {
        breakpoints: pictureTagAssemblerURLParam.get('breakpoints'),
        imageService: pictureTagAssemblerURLParam.get('placeholder-service'),
        pixelDensity: pictureTagAssemblerURLParam.get('pixel-density')
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
            --pta-outer-pad: 15px;
            --pta-ui-bg-color: #1e2127;
            --pta-ui-text-color: #e0e0e0;
            --pta-ui-input-color: #131519;
            --pta-ui-input-height: 36px;
            --pta-border-radius-base: 8px;
            --pta-fs: 11px;
            --pta-ff-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
            --pta-lh: 1.2;
        }

        .js-pta-p-key-pressed *:not(img) {
            pointer-events: none;

            img {
                pointer-events: auto;
            }
        }

        .picture-tag-assembler {
            width: 220px;
            position: absolute;
            z-index: 100000;
            background: var(--pta-ui-bg-color);
            font-size: var(--pta-fs);
            border-radius: var(--pta-border-radius-base);
            box-shadow: 0 19px 38px rgba(0, 0, 0, .4);
            outline: none !important;
            box-sizing: border-box;


            * {
                font-family: var(--pta-ff-primary) !important;
                font-size: var(--pta-fs);
                color: var(--pta-ui-text-color);
                box-sizing: border-box;
            }
        }

        .picture-tag-assembler__title {
            position: relative;
            z-index: 0;
            overflow: hidden;
            padding-right: 40px;
            white-space: nowrap;
            font-size: 1.16666em;
            font-weight: 600;
            padding: 10px var(--pta-outer-pad);
            border-bottom: 1px solid var(--pta-ui-input-color);
        }

        .picture-tag-assembler__body {
            padding: 10px var(--pta-outer-pad) 5px var(--pta-outer-pad);
        }

        .picture-tag-assembler__footer {
            padding: 10px var(--pta-outer-pad) var(--pta-outer-pad) var(--pta-outer-pad);
        }

        .picture-tag-assembler__submit,
        .picture-tag-assembler__test-btn,
        .picture-tag-assembler__copy-btn {
            /*padding: 6px 20px;*/
            border-radius: 30px;
            background-color: #343944;
            text-align: center;
            cursor: pointer;
            height: var(--pta-ui-input-height);
            align-content: center;
            font-family: var(--pta-ff-primary);
            font-size: var(--pta-fs);
            position: relative;
            overflow: hidden;
            line-height: 1.3;
            font-weight: 400;
            color: var(--pta-ui-text-color);
            width: 115px;
        }

        .picture-tag-assembler__submit-loader {
            display: block;
            width: 100%;
            height: var(--pta-ui-input-height);
            position: absolute;
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
                border-radius: 30px;
                animation: pta_loader 1800ms infinite;
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
            &:not(:last-child) {
                margin-bottom: 20px;
            }

            > * {
                display: block;
            }

            & label {
                line-height: var(--pta-lh);
                margin-bottom: 5px;
            }

            & input[type="text"] {
                padding-left: 8px;
                padding-right: 0;
                border-radius: calc(var(--pta-border-radius-base) / 1.5);
                font-size: var(--pta-fs);
                box-shadow: none;
                width: calc(100% + 4px);
                margin-left: -2px;
                line-height: var(--pta-lh);
                background-color: var(--pta-ui-input-color);
                color: var(--pta-ui-text-color);
                border: 0 !important;
                height: var(--pta-ui-input-height);
                position: relative;

                /* &:after {
                    content: '';
                    position: absolute;
                    width: 40px;
                    height: 100%;
                    top: 0;
                    right: 0;
                    background-color: red;
                } */
            }
        }

        .picture-tag-assembler__small {
            margin-top: 4px;
            font-size: 9px;
            line-height: var(--pta-lh);
            opacity: .75;
        }

        .picture-tag-assembler__modal {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate3d(-50%, -50%, 0);
            z-index: 100001;
            border-radius: var(--pta-border-radius-base);
            padding: 0;
            overflow: hidden;
            background-color: var(--pta-ui-bg-color);

            & pre {
                padding: 0;
                background-color: transparent;
            }

            & code,
            & pre {
                font-size: 10px;
                margin-bottom: 0;
            }
        }

        .picture-tag-assembler__modal-body {
            overflow: auto;
            max-width: 728px;
            width: 100%;
        }

        body:has(.js-pta--in-progress) {
            .picture-tag-assembler__modal {
                display: none;
            }
        }

        .picture-tag-assembler__footer {
            position: relative;
        }

        /*picture-tag-assembler-iframe-container {
            top: 0;
            left: 0;
            z-index: 100000;
            position: absolute;
            width: 100%;
            height: 100vh;
            border: 10px solid red;
            opacity: .75;
            transform: scale(.1, .1);

            > * {
                filter: grayscale(1);
            }
        }*/

        .picture-tag-assembler-iframe-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 0;
            height: 0;
            overflow: hidden;
        }
    `;

    const styleTag = document.createElement('style');
    styleTag.textContent = pictureTagAssemblerStyles;
    document.head.appendChild(styleTag);

    const infoModalMarkup = /* html */`
        <div class="picture-tag-assembler__modal-dialog">
            <div class="picture-tag-assembler__modal-header">
                <div class="picture-tag-assembler__test-btn" role="button">Test</div>
                <div class="picture-tag-assembler__copy-btn" role="button">Copy</div>
            </div>
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
    const ptaBreakpoints = (ptaParams.breakpoints) ? ptaParams.breakpoints.trim().replace(/\s+/g, '').split(',').join(', ') : '576,  768, 992, 1200, 1600';
    let ptaImageService = (ptaParams.imageService) ? ptaParams.imageService : 'none';
    ptaImageService = (ptaImageService === 'none') ? 'none' : 'https://picsum.photos';

    let ptaPixelDensity = (ptaParams.pixelDensity) ? ptaParams.pixelDensity.trim().replace(/\s+/g, '').split(',').join(', ').split(',') : 'none';

    const infoDialogMarkup = /* html */`
        <div class="picture-tag-assembler__dialog">
            <div class="picture-tag-assembler__header">
                <div class="picture-tag-assembler__title">Picture Tag Assembler</div>
            </div>
            <div class="picture-tag-assembler__body">
                <div class="picture-tag-assembler__form-group">
                    <label for="pictureTagAssemblerBreakpoints">Breakpoints (px):</label>
                    <input id="pictureTagAssemblerBreakpoints" type="text" placeholder="Breakpoints" value="${ptaBreakpoints}">
                    <div class="picture-tag-assembler__small">Comma separated numbers.</div>
                </div>
                <div class="picture-tag-assembler__form-group">
                    <label for="pictureTagAssemblerPixelDensity">Pixel density:</label>
                    <input id="pictureTagAssemblerPixelDensity" type="text" placeholder="Enter URL" value="${ptaPixelDensity}">
                    <div class="picture-tag-assembler__small">Comma separated numbers.</div>
                </div>
                <div class="picture-tag-assembler__form-group">
                    <label for="pictureTagAssemblerImageService">Image service:</label>
                    <input id="pictureTagAssemblerImageService" type="text" placeholder="Enter URL" value="${ptaImageService}">
                </div>
            </div>
            <div class="picture-tag-assembler__footer">
                <div class="picture-tag-assembler__submit" role="button" tabindex="0">
                    <span class="picture-tag-assembler__submit-initial">Generate</span>
                    <span class="picture-tag-assembler__submit-generating">
                        <span class="picture-tag-assembler__visually-hidden">Generating</span>
                        <span class="picture-tag-assembler__submit-loader"></span>
                    </span>
                </div>
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
            <iframe id="pictureTagAssemblerIframe" scrolling="no" src="${window. location. href}" frameborder="0" height="720" allow-same-origin></iframe>
        `;

        const hiddenIframeDiv = document.createElement('div');
        hiddenIframeDiv.classList.add('picture-tag-assembler-iframe-container')
        hiddenIframeDiv.innerHTML = iframeMarkup;

        // document.querySelector('.picture-tag-assembler__footer').appendChild(hiddenIframeDiv);
        document.body.appendChild(hiddenIframeDiv);

        const iframe = document.getElementById('pictureTagAssemblerIframe');
        const imageService = service;

        const getImageInfo = (loadedIFrameContent, imageSelector) => {
            const iframeDoc = loadedIFrameContent.contentDocument || loadedIFrameContent.contentWindow.document;
            iframeDoc.body.classList.add('js-no-pta');
            const image = iframeDoc.querySelector(imageSelector);
            const accordion = image.closest('.collapse');

            if (accordion) {
                accordion.style.display = "block !importaint";
            }

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

        const finalBreakpoints = breakpoints;
        const viewportSizes = finalBreakpoints.split(',');
        let pictureTagGeneratedMarkup;

        const runThroughViewportSizes = (iframe) => {
            let pictureTagCreated = false;
            let lastSrcset = '';
            const selectedImage = document.querySelector(thisImage);
            const densityInputValue = document.querySelector('#pictureTagAssemblerPixelDensity').value;
            const finalDensities = (densityInputValue !== 'none') ? densityInputValue.split(',') : null;

            viewportSizes.forEach((size, index) => {
                const breakpointNum = parseInt(size);

                setTimeout(() => {
                    iframe.setAttribute('width', breakpointNum - 1 + 'px');
                    const {
                        dWidth: imageWidth,
                        dHeight: imageHeight,
                        imageTag
                    } = getImageInfo(iframe, thisImage);

                    const imageSourceUrl = (imageService === 'none') ? selectedImage.src : imageService;
                    let serviceURL = (imageService === 'none') ? `${imageSourceUrl}?width=${imageWidth}&height=${imageHeight}` : `${imageSourceUrl}/${imageWidth}/${imageHeight}?width=${imageWidth}&height=${imageHeight}`;

                    // Generate <picture> tag if dWidth > 0 and hasn't been created
                    if (imageWidth > 0 && !pictureTagCreated) {
                        const imageHTML = imageTag.outerHTML;
                        pictureTagGeneratedMarkup = (imageTag.closest('picture')) ? imageTag.closest('picture').cloneNode(false) : document.createElement('picture');
                        pictureTagGeneratedMarkup.innerHTML = imageHTML;

                        const imageEl = pictureTagGeneratedMarkup.querySelector('img');
                        imageEl.setAttribute('width', imageWidth);
                        imageEl.setAttribute('height', imageHeight);
                        imageEl.setAttribute('src', serviceURL);
                        imageEl.removeAttribute('data-picture-tag-assembler');
                        imageEl.removeAttribute('data-pta-index');

                        if (finalDensities) {
                            let densitySrcArr = [];

                            for (const item of finalDensities) {
                                densitySrcArr.push(setPixelDensity(item, imageSourceUrl, imageWidth, imageHeight));
                            }

                            const densityString = densitySrcArr.toString().replace(/,/g, ', ');
                            imageEl.setAttribute('srcset', densityString);
                        }

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
                            pictureTagGeneratedMarkup.prepend(sourceTag);

                            if (finalDensities) {
                                let densitySrcArr = [];

                                for (const item of finalDensities) {
                                    densitySrcArr.push(setPixelDensity(item, imageSourceUrl, imageWidth, imageHeight));
                                }

                                const densityString = densitySrcArr.toString().replace(/,/g, ', ');
                                let currentSrcSet = sourceTag.getAttribute('srcset');
                                currentSrcSet = currentSrcSet + ', ' + densityString;
                                sourceTag.setAttribute('srcset', currentSrcSet);
                            }
                        }

                        lastSrcset = serviceURL;
                    }

                    // Final beautify and render on last iteration
                    if (index === viewportSizes.length - 1) {
                        const pictureHTMLText = html_beautify(pictureTagGeneratedMarkup.outerHTML, {
                            'indent_size': 4,
                            'preserve_newlines': true,
                            'max_preserve_newlines': 1,
                            'inline': ['span', 'b', 'i']
                        });
                        modalCodeElement.textContent = pictureHTMLText.replace(/&amp;/g, '&');;
                        hljs.highlightElement(modalCodeElement);
                        hiddenIframeDiv.remove();
                        document.querySelector('.js-pta--in-progress').classList.remove('js-pta--in-progress');

                        const currentDialog = document.querySelector('.picture-tag-assembler');

                        if (currentDialog) {
                            currentDialog.remove();
                        }

                        document.querySelector('.picture-tag-assembler__test-btn').addEventListener('click', () => {
                            let imageEl = document.querySelector(thisImage);
                            let replaceThisEl = (imageEl.closest('picture')) ? imageEl.closest('picture') : imageEl;
                            replaceThisEl.insertAdjacentHTML('afterend', pictureHTMLText);
                            replaceThisEl.remove();
                        });

                        modalElement.style.display = 'block';
                    }
                }, index * 1000);
            });
        };

        function setPixelDensity(item, src, width, height) {
            const int = parseInt(item);
            const placeholderService = document.querySelector('#pictureTagAssemblerImageService').value;
            let srcAdjust = (placeholderService !== 'none' && placeholderService !== '') ? `${src}/${width * int}/${height * int}` : src;
            return `${srcAdjust}?width=${width * int}&height=${height * int} ${int}x`;
        }

        iframe.addEventListener('load', () => {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const iframeImages = iframeDoc.querySelectorAll('img[loading="lazy"]');

            for (const imgLazy of iframeImages) {
                imgLazy.removeAttribute('loading');
            }

            const imageLoadPromises = Array.from(iframeImages).map(img => {
                return new Promise(resolve => {
                    if (img.complete) {
                        resolve();
                    } else {
                        img.addEventListener('load', resolve);
                        img.addEventListener('error', resolve);
                    }
                });
            });

            Promise.all(imageLoadPromises).then(() => {
                console.log('All images loaded:', iframeImages.length);

                for (const imgLazy of iframeImages) {
                    imgLazy.setAttribute('loading', 'lazy');
                }

                runThroughViewportSizes(iframe);
            });
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

    const ptaCopyButton = document.querySelector('.picture-tag-assembler__copy-btn');
    ptaCopyButton.addEventListener('click', () => {
        copyToClipboard(modalCodeElement);
    });

    function copyToClipboard(el) {
        const textToCopy = el.textContent;

        navigator.clipboard.writeText(textToCopy).then(() => {
            console.log('Text copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
});