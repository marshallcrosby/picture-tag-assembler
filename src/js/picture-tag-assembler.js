/*!
    * Picture Tag Assembler v0.0.3
    * Plugin that attempts to generate a picture tag from a single image tag.
    *
    * Copyright 2024 Marshall Crosby
    * https://marshallcrosby.com
*/


/*
    TODOS:
    ✓ Make dialog form element IDs unique
    ✓ Remove attributes on generated picture > img element
    ✓ Bring in beautify.js and highlight.js javascript and css if needed
    ✓ Create and fire a modal with beautified/highlighted picture tag
    ✓ Style '.picture-tag-assembler' panel
    ✓ Fix media attribute logic
    ✓ Figure out if iframe scrollbar is causing issues with returned image sizes
    ✓ Figure out if lazy load is needed and if so re-add the attribute
    ✓ URL params like default breakpoints, and photo service
    • Use image url as Service url setting
    • Cache input settings
    • Make modal accessible
    • Add "Copied" to "Copy" button when clicked
    • Add some UX to the "Test" button
    • Keyboard traps
    • Clean up/add comments
*/

const queryParamTestString = 'https://example.com?breakpoints=576&placeholder-service=https://picsum.photos';

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
        pixelDensity: null,
        timeBetweenCheck: null
    }

    const pictureTagAssemblerScriptTag = document.querySelectorAll('script[src*="picture-tag-assembler."]')[0];
    if (pictureTagAssemblerScriptTag) {
        const pictureTagAssemblerURLParam = new URLSearchParams(pictureTagAssemblerScriptTag.getAttribute('src').split('?')[1]);


        ptaParams = {
            breakpoints: pictureTagAssemblerURLParam.get('breakpoints'),
            imageService: pictureTagAssemblerURLParam.get('placeholder-service'),
            pixelDensity: pictureTagAssemblerURLParam.get('pixel-density'),
            timeBetweenCheck: pictureTagAssemblerURLParam.get('time-between-check')
        }
    }

    // const pictureTagAssemblerURLParam = new URLSearchParams(pictureTagAssemblerScriptTag.getAttribute('src').split('?')[1]);
    // const pictureTagAssemblerURLParam = new URLSearchParams(queryParamTestString.split('?')[1]);

    // ptaParams = {
    //     breakpoints: pictureTagAssemblerURLParam.get('breakpoints'),
    //     imageService: pictureTagAssemblerURLParam.get('placeholder-service'),
    //     pixelDensity: pictureTagAssemblerURLParam.get('pixel-density'),
    //     timeBetweenCheck: pictureTagAssemblerURLParam.get('time-between-check')
    // }

    /*
        Import beautify-html
     */
    //=require ../../dist/temp/beautify-html.min.js

    /*
        Import highlight
     */
    //=require ../../dist/temp/highlight.min.js

    const pictureTagAssemblerStyles = `//=inject picture-tag-assembler.css`;
    const ptaStyleTag = document.createElement('style');
    
    ptaStyleTag.textContent = pictureTagAssemblerStyles;
    document.head.appendChild(ptaStyleTag);
    
    
    const highlightCSS = `//=inject atom.css`;
    const highlightStyleTag = document.createElement('style');
    
    highlightStyleTag.textContent = highlightCSS;
    document.head.appendChild(highlightStyleTag);

    const infoModalMarkup = `//=inject _picture-tag-assembler-modal.html`;

    const modalElement = document.createElement('div');
    modalElement.classList.add('picture-tag-assembler__modal');
    modalElement.setAttribute('aria-labelledby', 'pictureTagAssemblerTitle');
    modalElement.innerHTML = infoModalMarkup;
    document.body.appendChild(modalElement);
    
    const modalCodeElement = modalElement.querySelector('.picture-tag-assembler__modal code');
    const ptaBreakpoints = (ptaParams.breakpoints) ? ptaParams.breakpoints.trim().replace(/\s+/g, '').split(',').join(', ') : '576,  768, 992, 1200, 1600';
    let ptaImageService = (ptaParams.imageService) ? ptaParams.imageService : 'none';
    ptaImageService = (ptaImageService === 'none') ? 'none' : 'https://picsum.photos';

    let ptaPixelDensity = (ptaParams.pixelDensity) ? ptaParams.pixelDensity.trim().replace(/\s+/g, '').split(',').join(', ').split(',') : 'none';

    const infoDialogMarkup = `//=inject _picture-tag-assembler-dialog.html`;

    const positionDialogTopMousePointer = (dialogEl, event) => {
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        const pointerX = mouseX - document.body.getBoundingClientRect().left;
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

        submitButton.addEventListener('click', (event) => {
            const finalBreakpoints = dialogElement.querySelector('#pictureTagAssemblerBreakpoints').value;
            const finalService = dialogElement.querySelector('#pictureTagAssemblerImageService').value;

            pictureTagAssembler(`[data-pta-index="${imageIndex}"]`, finalBreakpoints, finalService);

            event.target.closest('.picture-tag-assembler').classList.add('js-pta--in-progress');
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
        const timeBetween = (ptaParams.timeBetweenCheck) ? ptaParams.timeBetweenCheck : 1000;
        let pictureTagGeneratedMarkup;

        console.log(timeBetween);

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

                        document.querySelector('.picture-tag-assembler__modal-test-btn').addEventListener('click', () => {
                            let imageEl = document.querySelector(thisImage);
                            let replaceThisEl = (imageEl.closest('picture')) ? imageEl.closest('picture') : imageEl;
                            replaceThisEl.insertAdjacentHTML('afterend', pictureHTMLText);
                            replaceThisEl.remove();
                        });

                        modalElement.style.display = 'block';

                        document.querySelector('.picture-tag-assembler__modal-close-btn').addEventListener('click', () => {
                            modalElement.style.display = '';
                        });
                    }
                }, index * timeBetween);
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

    const ptaCopyButton = document.querySelector('.picture-tag-assembler__modal-copy-btn');
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