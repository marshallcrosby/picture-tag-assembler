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

    modalCloseButton = modalElement.querySelector('.picture-tag-assembler__close-btn');
    modalCloseButton.addEventListener('click', () => {
        modalElement.style.display = '';
    });

    function displayModal() {
        modalElement.style.display = 'block';

        document.querySelector('.picture-tag-assembler__modal .picture-tag-assembler__close-btn').addEventListener('click', () => {
            modalElement.style.display = '';
        });
    }
    
    const modalCodeElement = modalElement.querySelector('.picture-tag-assembler__modal code');
    const ptaBreakpoints = (ptaParams.breakpoints) ? ptaParams.breakpoints.trim().replace(/\s+/g, '').split(',').join(', ') : '576,  768, 992, 1200, 1600';
    let ptaImageService = (ptaParams.imageService) ? ptaParams.imageService : 'none';
    ptaImageService = (ptaImageService === 'none') ? 'none' : 'https://picsum.photos';

    let ptaPixelDensity = (ptaParams.pixelDensity) ? ptaParams.pixelDensity.trim().replace(/\s+/g, '').split(',').join(', ').split(',') : '';

    const infoDialogMarkup = `//=inject _picture-tag-assembler-dialog.html`;

    let submitButton

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

        submitButton = dialogElement.querySelector('.picture-tag-assembler__submit');
        submitButton.setAttribute('data-pta-associated-index', imageIndex);

        positionDialogTopMousePointer(dialogElement, event);

        dialogElement.focus();

        submitButton.addEventListener('click', (event) => {
            const finalBreakpoints = dialogElement.querySelector('#pictureTagAssemblerBreakpoints').value;
            const finalService = dialogElement.querySelector('#pictureTagAssemblerImageService').value;

            pictureTagAssembler(`[data-pta-index="${imageIndex}"]`, finalBreakpoints, finalService);

            event.target.closest('.picture-tag-assembler').classList.add('js-pta--in-progress');
        });

        const dialogCloseButton = dialogElement.querySelector('.picture-tag-assembler__close-btn');
        dialogCloseButton.addEventListener('click', () => {
            dialogElement.remove();
        });

        // Clicking on data-step-target element displays data-pta-step pane and hides others
        document.addEventListener('click', (event) => {
            if (event.target.matches('[data-step-target]')) {
                const targetStep = event.target.getAttribute('data-step-target');
                const dialogElement = event.target.closest('.picture-tag-assembler');
                const allPanes = dialogElement.querySelectorAll('.picture-tag-assembler__pane');

                allPanes.forEach(pane => {
                    if (pane.getAttribute('data-pta-step') === targetStep) {
                        pane.removeAttribute('hidden');
                    } else {
                        pane.setAttribute('hidden', '');
                    }
                });
            }
        });

        // Clicking on .picture-tag-assembler__view-specs displays image info modal
        const viewSpecsButton = dialogElement.querySelector('.picture-tag-assembler__view-specs');
        viewSpecsButton.addEventListener('click', (event) => {
            const imageToInspectIndex = event.target.closest('.picture-tag-assembler').querySelector('.picture-tag-assembler__submit').getAttribute('data-pta-associated-index');
            const imageToInspectElement = document.querySelector(`[data-pta-index="${imageToInspectIndex}"]`);
            displayImageInfo(imageToInspectElement);
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
            <iframe id="pictureTagAssemblerIframe" scrolling="no" src="${window.location.href}" frameborder="0" height="720" allow-same-origin></iframe>
        `;

        const hiddenIframeDiv = document.createElement('div');
        hiddenIframeDiv.classList.add('picture-tag-assembler-iframe-container')
        hiddenIframeDiv.innerHTML = iframeMarkup;

        // document.querySelector('.picture-tag-assembler__footer').appendChild(hiddenIframeDiv);
        document.body.appendChild(hiddenIframeDiv);

        const iframe = document.getElementById('pictureTagAssemblerIframe');
        const imageService = service;

        const getImageInfo = (loadedIFrameContent, imageSelector) => {
            return new Promise((resolve, reject) => {
                const iframeDoc = loadedIFrameContent.contentDocument || loadedIFrameContent.contentWindow.document;
                iframeDoc.body.classList.add('js-no-pta');
                const image = iframeDoc.querySelector(imageSelector);
                const accordion = image.closest('.collapse');

                if (accordion) {
                    accordion.style.display = "block !important";
                }

                if (!image) {
                    console.log('Image not found in iframe.');
                    reject(new Error('Image not found in iframe.'));
                    return;
                }

                // Function to check if image is loaded and return dimensions
                const checkImageLoaded = () => {
                    // For images in picture tags, we need to check the actual displayed image
                    const displayedImage = image.closest('picture') ? 
                        image.closest('picture').querySelector('img') : image;
                    
                    if (displayedImage && displayedImage.complete && displayedImage.naturalWidth > 0) {
                        resolve({
                            imageTag: image,
                            iSrc: image.src,
                            dWidth: image.clientWidth,
                            dHeight: image.clientHeight
                        });
                    } else {
                        // Image not yet loaded, wait for load event
                        const handleLoad = () => {
                            displayedImage.removeEventListener('load', handleLoad);
                            displayedImage.removeEventListener('error', handleError);
                            resolve({
                                imageTag: image,
                                iSrc: image.src,
                                dWidth: image.clientWidth,
                                dHeight: image.clientHeight
                            });
                        };

                        const handleError = () => {
                            displayedImage.removeEventListener('load', handleLoad);
                            displayedImage.removeEventListener('error', handleError);
                            console.warn('Image failed to load, using current dimensions');
                            resolve({
                                imageTag: image,
                                iSrc: image.src,
                                dWidth: image.clientWidth,
                                dHeight: image.clientHeight
                            });
                        };

                        displayedImage.addEventListener('load', handleLoad);
                        displayedImage.addEventListener('error', handleError);
                        
                        // Fallback timeout in case the load event doesn't fire
                        setTimeout(() => {
                            displayedImage.removeEventListener('load', handleLoad);
                            displayedImage.removeEventListener('error', handleError);
                            console.warn('Image load timeout, using current dimensions');
                            resolve({
                                imageTag: image,
                                iSrc: image.src,
                                dWidth: image.clientWidth,
                                dHeight: image.clientHeight
                            });
                        }, 5000); // 5 second timeout
                    }
                };

                checkImageLoaded();
            });
        };

        const finalBreakpoints = breakpoints;
        const viewportSizes = finalBreakpoints.split(',');
        let pictureTagGeneratedMarkup;

        const runThroughViewportSizes = async (iframe) => {
            let pictureTagCreated = false;
            let lastSrcset = '';
            const selectedImage = document.querySelector(thisImage);
            const densityInputValue = document.querySelector('#pictureTagAssemblerPixelDensity').value;
            const finalDensities = (densityInputValue !== '') ? densityInputValue.split(',') : null;
            const viewportSizesLength = viewportSizes.length;
            let viewportCounter = 0;
            const circleLoaderCircle = document.querySelector('.picture-tag-assembler__progress-circle');
            const circleLoaderPercent = document.querySelector('.picture-tag-assembler__progress-percent');

            // time-between-check is set use that in between viewport size checks
            const timeBetweenCheck = (ptaParams.timeBetweenCheck) ? parseInt(ptaParams.timeBetweenCheck) : 100;

            for (let index = 0; index < viewportSizes.length; index++) {
                if (timeBetweenCheck > 0) {
                    await new Promise(resolve => setTimeout(resolve, timeBetweenCheck));
                }
                
                const size = viewportSizes[index];
                const breakpointNum = parseInt(size);

                // Set iframe width and allow for browser reflow
                iframe.setAttribute('width', breakpointNum - 1 + 'px');
                
                // Small delay to allow browser reflow before checking image dimensions
                await new Promise(resolve => setTimeout(resolve, 100));
                
                try {
                    const {
                        dWidth: imageWidth,
                        dHeight: imageHeight,
                        imageTag
                    } = await getImageInfo(iframe, thisImage);

                    viewportCounter++;
                    circleLoaderCircle.style.setProperty('stroke-dashoffset', 138.22996 - (138.22996 * (viewportCounter / viewportSizesLength)));

                    
                    // Quickly count to next percentage
                    const percentComplete = Math.round((viewportCounter / viewportSizesLength) * 100);
                    let currentPercent = parseInt(circleLoaderPercent.textContent);
                    const percentInterval = setInterval(() => {
                        if (currentPercent < percentComplete) {
                            currentPercent++;
                            circleLoaderPercent.textContent = `${currentPercent}`;
                        } else {
                            clearInterval(percentInterval);
                        }
                    }, (viewportSizesLength * 10));


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
                        modalCodeElement.textContent = pictureHTMLText.replace(/&amp;/g, '&');
                        hljs.highlightElement(modalCodeElement);
                        hiddenIframeDiv.remove();
                        document.querySelector('.js-pta--in-progress').classList.remove('js-pta--in-progress');

                        const currentDialog = document.querySelector('.picture-tag-assembler');

                        if (currentDialog) {
                            setTimeout(() => {
                                currentDialog.remove();
                            }, 1000);
                        }

                        document.querySelector('.picture-tag-assembler__modal-test-btn').addEventListener('click', () => {
                            let imageEl = document.querySelector(thisImage);
                            let replaceThisEl = (imageEl.closest('picture')) ? imageEl.closest('picture') : imageEl;
                            replaceThisEl.insertAdjacentHTML('afterend', pictureHTMLText);
                            replaceThisEl.remove();
                        });

                        setTimeout(() => {
                            displayModal();
                        }, 1000);

                    }
                } catch (error) {
                    console.error('Error getting image info for viewport size', size, ':', error);
                    // Continue to next viewport size on error
                }
            }
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

    const displayImageInfo = (el) => {
        const pictureOrImageElement = el.closest('picture') ? el.closest('picture') : el;
        const imageElement = (pictureOrImageElement.querySelector('img')) ? pictureOrImageElement.querySelector('img') : pictureOrImageElement;
        let sources = [];

        if (pictureOrImageElement.tagName.toLowerCase() === 'picture') {
            sources = [...pictureOrImageElement.querySelectorAll('source, img')];
        } else {
            sources = [imageElement];
        }

        let maxWidth = 0;
        let maxHeight = 0;
        let imageDetails = [];

        function getIntrinsicSize(src, callback) {
            const tempImgElement = new Image();
            
            tempImgElement.onload = function () {
                callback(tempImgElement.naturalWidth, tempImgElement.naturalHeight);
            };

            tempImgElement.src = src;
        }

        sources.forEach((source, index) => {
            const srcUrl = source.srcset || source.src || '';
            
            getIntrinsicSize(srcUrl, async (width, height) => {
                // Parse srcset to handle pixel density descriptors
                const srcsetParts = srcUrl.split(',').map(s => s.trim());
                let entries = [];
                
                for (const part of srcsetParts) {
                    const [url, descriptor = '1x'] = part.split(/\s+/);
                    const density = descriptor.replace('x', '');
                    
                    await new Promise((resolve) => {
                        getIntrinsicSize(url, (w, h) => {
                            entries.push({
                                url: url,
                                density: descriptor,
                                width: w,
                                height: h
                            });
                            resolve();
                        });
                    });
                }
                
                let entry = {
                    order: index + 1,
                    type: source.tagName.toLowerCase() === 'img' ? 'Img Source' : 'Source',
                    src: srcUrl,
                    media: source.media || '(none)',
                    size: `${width}&times;${height}px`,
                    densities: entries
                };

                imageDetails.push(entry);

                if (width > maxWidth) maxWidth = width;
                
                if (height > maxHeight) maxHeight = height;

                if (imageDetails.length === sources.length) {
                    imageDetails.sort((a, b) => a.order - b.order);

                    let imageInfoElement = imageDetails.map(item => {
                        let densityInfo = '';
                        if (item.densities && item.densities.length > 1) {
                            densityInfo = '<br>&nbsp;&nbsp;<strong>Pixel Densities:</strong><br>' + 
                                item.densities.map(d => 
                                    `&nbsp;&nbsp;&nbsp;&nbsp;${d.density}: ${d.width}&times;${d.height}px`
                                ).join('<br>');
                        }
                        
                        return `
                        <strong>${item.type} ${item.order}:</strong><br>
                        &nbsp;&nbsp;src: ${item.src}<br>
                        &nbsp;&nbsp;media: ${item.media}<br>
                        <strong>Intrinsic Size:</strong> ${item.size}${densityInfo}<br>
                    `}).join('<br>');

                    imageInfoElement += imageElement.alt.trim() === '' ? "<br>Alt text should be empty\n" : "<br>Alt text is required\n";

                    imageInfoElement += `<br>Recommended original image size: ${maxWidth}x${maxHeight}px<br>`;

                    modalElement.querySelector('.picture-tag-assembler__modal-body').innerHTML = `<div class="picture-tag-assembler__modal-info">${imageInfoElement}</div>`;
                    displayModal();
                }
            });
        });
    }
});