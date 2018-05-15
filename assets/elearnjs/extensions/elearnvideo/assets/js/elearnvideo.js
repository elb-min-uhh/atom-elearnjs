/*
* video.js v0.4.2 - 18/05/15
* JavaScript Videoplayer - by Arne Westphal
* eLearning Buero MIN-Fakultaet - Universitaet Hamburg
*/

var eLearnVideoJS = eLearnVideoJS || {};

eLearnVideoJS.localization = {
    "de" : {
        "play": "Abspielen",
        "pause": "Pausieren",
        "mute": "Stummschalten",
        "time": "Zeit",
        "timeleft": "Verbleibende Zeit",
        "duration": "Dauer",
        "fullscreen": "Vollbild",
        "annotations": "Annotationen",
        "usernotes": "Notizen",
        "notehint": "Notiz anzeigen",
        "notesave": "Notiz speichern",
        "notecancel": "Abbrechen",
        "noteadd": "Notiz hinzufügen",
        "displayall": "Alle einblenden",
        "error": "Ein Fehler ist aufgetreten.<br>Das Video kann nicht abgespielt werden.<br>Klicken zum neu laden!",
        "alert.notenotext": "Text eingeben, um Notiz speichern zu können.",
        "alert.noteinvalidstart": "Die Startzeit ist keine gültige Eingabe.\r\nFormat: HH:MM:SS",
        "alert.noteinvalidend": "Die Endzeit ist keine gültige Eingabe.\r\nFormat: HH:MM:SS",
        "alert.importreset": "Aktuelle Notizen können vor dem Import gelöscht und somit durch neue Notizen ersetzt werden.\r\n'OK' zum Ersetzen, 'Abbrechen' zum Hinzufügen.",
        "alert.importsuccess": "Notizen erfolgreich importiert.",
        "alert.importerror": "Die Datei scheint nicht zum import geeignet zu sein.",
        "alert.nonotes": "Keine Notizen vorhanden.",
        "alert.localstorageerror": "Die letzte Notizänderung konnte nicht gespeichert werden, da der lokale Speicher voll ist.",
        "alert.remove": "Soll diese Notiz wirklich dauerhaft gelöscht werden?",
        "alert.removeall": "Sollen wirklich alle Notizen dieses Videos dauerhaft gelöscht werden?",
        "dropdown.import": "Notizen importieren",
        "dropdown.export": "Notizen exportieren als JSON",
        "dropdown.exportcsv": "Notizen exportieren als CSV",
        "dropdown.removeall": "Alle Notizen löschen",
        "dropdown.edit": "Bearbeiten",
        "dropdown.remove": "Löschen",
        "dropdown.moveup": "Nach oben bewegen",
        "dropdown.movedown": "Nach unten bewegen",
        "placeholder.start": "Start",
        "placeholder.end": "Ende",
        "placeholder.writenote": "Schreibe eine Notiz... (diese sind lokal gespeichert und nicht öffentlich)",

    },
    "en" : {
        "play": "Play",
        "pause": "Pause",
        "mute": "Mute",
        "time": "Time",
        "timeleft": "Time left",
        "duration": "Duration",
        "fullscreen": "Fullscreen",
        "annotations": "Annotations",
        "usernotes": "Notes",
        "notehint": "Display Note",
        "notesave": "Save Note",
        "notecancel": "Cancel",
        "noteadd": "Add Note",
        "displayall": "Display all",
        "error": "An error occurred.<br>The video cannot be played.<br>Click to reload!",
        "alert.notenotext": "Insert a text before saving a note.",
        "alert.noteinvalidstart": "Start time is not valid.\r\nFormat: HH:MM:SS",
        "alert.noteinvalidend": "End time is not valid.\r\nFormat: HH:MM:SS",
        "alert.importreset": "You can delete current notes before importing others to replace them.\r\n'OK' to replace, 'Cancel' to keep both.",
        "alert.importsuccess": "Notes imported successfully",
        "alert.importerror": "The file seems to be invalid and cannot be imported.",
        "alert.nonotes": "No notes existing.",
        "alert.localstorageerror": "The last notes change could not be saved. The LocalStorage seems to be full.",
        "alert.remove": "Really remove this note permanently?",
        "alert.removeall": "Really remove all notes for this video permanently?",
        "dropdown.import": "Import Notes",
        "dropdown.export": "Export Notes as JSON",
        "dropdown.exportcsv": "Export Notes as CSV",
        "dropdown.removeall": "Remove all Notes",
        "dropdown.edit": "Edit",
        "dropdown.remove": "Remove",
        "dropdown.moveup": "Move Up",
        "dropdown.movedown": "Move Down",
        "placeholder.start": "Start",
        "placeholder.end": "End",
        "placeholder.writenote": "Write a note... (notes are saved locally and are not public)",
    },
};

eLearnVideoJS.selectedLocale = eLearnVideoJS.selectedLocale || "de";

/**
* Initialisiert die Videoplayer
*/
$(document).ready(function() {
    eLearnVideoJS.initiateTouchDetection();
    eLearnVideoJS.initiateVideoPlayers();
    eLearnVideoJS.setLanguage(eLearnVideoJS.selectedLocale);
});

// ----------------------------------------------------------------------------
// ------------------------- VIDEO PLAYER -------------------------------------
// ----------------------------------------------------------------------------

eLearnVideoJS.video_hover_timers = {};
eLearnVideoJS.video_volumes = {};
eLearnVideoJS.video_timetypes = {
    TIMELEFT : 0,
    DURATION : 1
};
eLearnVideoJS.FILETYPE_JSON = 'json';
eLearnVideoJS.FILETYPE_CSV = 'csv';
eLearnVideoJS.video_timestyle = 0;
eLearnVideoJS.touchend_block = false;
eLearnVideoJS.touchend_timer = null;

eLearnVideoJS.user_notes = {};

/**
* Initiates all videoplayers, by adding wrapper around <video> elements.
* Also initiates all listeners and everything necessary, so that the players
* work correctly.
*/
eLearnVideoJS.initiateVideoPlayers = function() {
    eLearnVideoJS.loadLocalVideoNotesStorage();

    $('video').not('.ignore_elearnvideo').each(function(i,e) {
        this.controls = false;

        $(this).wrap('<div class="video-container">');
        $(this).wrap("<div class='elearnjs-video hovered' tabindex='-1'>");

        var div = $(this).parent();

        div.append("<div class='mobile-overlay'><div class='icon playpause paused'></div></div>");
        div.append("<div class='loading-overlay'><div class='loading-con'>"
                      + "<div class='loading-animation'>"
                        + "<div class='background'></div>"
                        + "<div class='inner'><div class='light'></div></div>"
                        + "<div class='inner skip'><div class='light'></div></div>"
                      + "</div>"
                    + "</div></div>");
        if(this.autoplay) {
            this.play();
        }
        else {
            div.append("<div class='play-overlay'><div class='icon play'></div></div>");
        }
        div.append("<div class='controls'>"
                      + "<div class='bottom-row'>"
                        + "<div class='icon playpause playing'></div>"
                        + "<div class='volume'>"
                            + "<div class='icon high' lang-code-title='mute'></div>"
                            + "<div class='volume-con'>"
                                + "<div class='volume-wrap'>"
                                    + "<div class='volume-bar'></div>"
                                    + "<div class='volume-control'></div>"
                                + "</div>"
                            + "</div>"
                        + "</div>"
                        + "<div class='text playtime' lang-code-title='time'></div>"
                        + "<div class='video-progress-con'>"
                            + "<div class='video-progress'><div class='video-progress-loaded'></div><div class='video-progress-bar'></div></div>"
                            + "<div class='video-progress-pointer'></div>"
                        + "</div>"
                        + "<div class='text timeleft'></div>"
                        + "<div class='icon fullscreen' lang-code-title='fullscreen'></div>"
                      + "</div>"
                    + "</div>");

        eLearnVideoJS.addVideoPlayerListener(div);
        eLearnVideoJS.videoCheckForBrowserSpecifics(div);
        eLearnVideoJS.updateVideoVolume(div);
    });

    eLearnVideoJS.addGenerelVideoPlayerListener();

    // only fallback values, should work without this resizes,
    // based on IntersectionObserver support
    document.addEventListener("ejssectionchange", eLearnVideoJS.resizeAllVideoPlayers);
    window.addEventListener("ejswindowresize", eLearnVideoJS.resizeAllVideoPlayers);
    $(window).resize(eLearnVideoJS.resizeAllVideoPlayers);
    // Used to explicitly set video-note width to equal video width
    window.addEventListener("ejsvideotouchmousechange", eLearnVideoJS.switchTouchMouse);
    eLearnVideoJS.initiateVideoNotes();
};

eLearnVideoJS.initListeners = function() {
    $('.elearnjs-video').each(function(i, e) {
        const el = $(e);
        try {
            var options = {
                root: document.body,
                rootMargin: '0px',
                threshold: 1.0
            }

            var observer = new IntersectionObserver(function(entries, observer) {
                for(var i=0; i<entries.length; i++) {
                    var entry = entries[i];
                    eLearnVideoJS.resizeVideoPlayer($(entry.target));
                }
            }, options);

            observer.observe(el.get(0));
        } catch(e) {
            // ignore
        };
        // resizesensor as visibility listener this will only work with Chrome engine browsers
        try {
            new ResizeSensor(el, function(dim) {
                eLearnVideoJS.resizeVideoPlayer(el);
            });
        } catch(e) {
            // ignore
        };
    });
};

/**
* Add general video player listeners. These are listeners which are not on the
* player itself but on the document.
*/
eLearnVideoJS.addGenerelVideoPlayerListener = function() {
    // Fullscreenchange
    $(document).bind('webkitfullscreenchange mozfullscreenchange fullscreenchange',
        eLearnVideoJS.checkVideoFullscreen);

    $(document).on('mouseup touchend', eLearnVideoJS.onMouseUp);
};

/**
* Adds all video player specific listeners. So every listener which is appended
* on a single video element or the wrapper of it.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.addVideoPlayerListener = function(div) {

    eLearnVideoJS.videoAddButtonListeners(div);
    eLearnVideoJS.videoAddUserInteractionListeners(div);
    eLearnVideoJS.videoAddProgressBarListeners(div);
    eLearnVideoJS.videoAddVolumeListeners(div);
    eLearnVideoJS.videoAddEventListeners(div);

    // fullscreen listeners
    div.on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function(event) {
        eLearnVideoJS.checkVideoFullscreen();
    });
    div.find('video').on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function(event) {
        eLearnVideoJS.checkVideoFullscreen();
    });

    // stop propagation at div in fullscreen, event not triggert in any parent
    div.on('blur change click contextmenu copy cut dblclick error foxus focusin focusout '
        + 'keydown keypress keyup load mousedown mouseenter mouseleave mousemove '
        + 'mouseout mouseover mouseup mousewheel paste reset resize scroll '
        + 'select submit textinput unload wheel '
        + 'orientationchange pointerdown pointermove pointerup '
        + 'touchstart touchmove touchend ', function(e) {
        if(div.is('.full')) {
            e.stopPropagation();
        }
    });
};

/**
* Adds listeners to buttons within the video player.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoAddButtonListeners = function(div) {
    // buttons
    div.find('.playpause').click(function(event) {
        event.preventDefault();
        event.stopPropagation();
        eLearnVideoJS.videoTogglePlay(div);
        eLearnVideoJS.videoHover(div);
    });
    div.find('.volume').find('.icon').on('mouseup touchend', function(event) {
        eLearnVideoJS.videoVolumeClick(div, event);
    });
    div.find('.volume').on('mouseenter', function(event) {
        eLearnVideoJS.videoVolumeHover(div, event);
    });
    div.find('.volume').on('mouseleave', function(event) {
        eLearnVideoJS.videoVolumeHover(div, event);
    });
    div.find('.timeleft').click(function(event) {
        event.preventDefault();
        event.stopPropagation();
        eLearnVideoJS.videoToggleTimeleftDuration();
    });
    div.find('.fullscreen').click(function(event) {
        event.preventDefault();
        event.stopPropagation();
        eLearnVideoJS.videoToggleFullscreen(div);
    });
};

/**
* Adds listeners to other player interaction. E.g. clicks on the video
* or touch events which are not targeted at a button.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoAddUserInteractionListeners = function(div) {
    div.on('touchstart touchend touchcancel', function(event) {
        eLearnVideoJS.videoRefreshHover(div, event);
    });

    // overlay
    div.find('.play-overlay').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        eLearnVideoJS.videoTogglePlay(div);
        eLearnVideoJS.videoHover(div);
        div.find('.play-overlay').remove();
    });

    // general player
    div.on('mousemove', function(event) {
        if(!div.is('.mobile')) {
            eLearnVideoJS.videoHover(div);
        }
    });
    div.on('mouseup touchend', eLearnVideoJS.onMouseUp);
    div.on('mouseup touchend', function(event) {
        if(event.type === "touchend" || event.button == 0) {
            // other listeneres take care of these
            if(eLearnVideoJS.videoProgressMouseDown || eLearnVideoJS.videoVolumeMouseDown
                || $(event.target).is('.bottom-row') || $(event.target).is('.bottom-row *')
                || $(event.target).is('.play-overlay') || $(event.target).is('.play-overlay *')
                || $(event.target).is('.mobile-overlay .playpause')
                || $(event.target).is('.error-con') || $(event.target).is('.error-con *')) {
                return true;
            }

            // touch
            if(event.type === "touchend") {
                // keine clicks durch 2. mouse event auf eingeblendete Elemente
                setTimeout(function() {eLearnVideoJS.videoToggleHover(div)}, 50);
                eLearnVideoJS.touchend_block = true;
                clearTimeout(eLearnVideoJS.touchend_timer);
                eLearnVideoJS.touchend_timer = setTimeout(function() {eLearnVideoJS.touchend_block = false;}, 100);
            }
            // no touch
            else if(!eLearnVideoJS.touchend_block) {
                eLearnVideoJS.videoOnClick(div);
            }
        }
    });
    div.on('mouseleave', function(event) {
        if(!div.is('.mobile')) {
            eLearnVideoJS.videoHoverEnd(div);
        }
    });

    div.bind('keydown', function(event) {
        eLearnVideoJS.videoKeyDown(div, event);
    });
};

/**
* Adds listeners to the progress bar. E.g. for time skipping and hover events.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoAddProgressBarListeners = function(div) {
    // progressbar
    div.find('.video-progress-con').on('mouseenter', function(event) {
        event.preventDefault();
        event.stopPropagation();
        eLearnVideoJS.videoProgressMouseEnter(div, event);
    });
    div.find('.video-progress-con').on('mouseleave', function(event) {
        event.preventDefault();
        event.stopPropagation();
        eLearnVideoJS.videoProgressMouseLeave(div, event);
    });
    div.on('mousemove touchmove', function(event) {
        eLearnVideoJS.videoProgressMouseMove(div, event);
    });
    div.find('.video-progress-con').on('mousedown touchstart', function(event) {
        event.preventDefault();
        event.stopPropagation();
        eLearnVideoJS.setVideoMouseDown(div, true);
        eLearnVideoJS.videoProgressMouseMove(div, event);
        if(event.type === "touchstart") div.append('<div class="progress-hover-time"></div>');
    });
};

/**
* Adds listeners to the volume bar. For volume changes.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoAddVolumeListeners = function(div) {
    // listener for video volume control
    div.on('mousemove touchmove', function(event) {
        if(eLearnVideoJS.videoVolumeMouseDown && eLearnVideoJS.videoVolumeMouseDownTarget != null) {
            event.preventDefault();
            event.stopPropagation();
            eLearnVideoJS.videoProgressVolumeMouseMove(div, event);
        }
    });
    div.find('.volume-con').on('mousedown touchstart', function(event) {
        eLearnVideoJS.setVideoVolumeMouseDown(div, true, event);
    });
};

/**
* Adds all events based on the exact video element. E.g. timeupdate/playpause
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoAddEventListeners = function(div) {
    var video = div.find('video');
    // listener to video progress
    video.on('ended', function(event) {
        eLearnVideoJS.videoHover(div);
    });
    video.on('timeupdate progress', function(event) {
        eLearnVideoJS.updateVideoTime(div);
        eLearnVideoJS.updateVideoUserNoteTime(div);
    });
    video.on('play', function(event) {
        eLearnVideoJS.videoUpdatePlayPauseButton(div);
    });
    video.on('pause', function(event) {
        eLearnVideoJS.videoUpdatePlayPauseButton(div);
    });
    video.on('volumechange', function(event) {
        eLearnVideoJS.updateVideoVolume(div);
    });
    video.on('error abort', function(event) {
        eLearnVideoJS.videoOnError(div, event);
    });
    video.on('canplay', function(event) {
        eLearnVideoJS.videoRemoveError(div, event);
        eLearnVideoJS.videoRemoveBuffering(div);
    });
    video.on('waiting', function(event) {
        eLearnVideoJS.videoOnBuffering(div, event);
    });
    video.on('resize', function(event) {
        eLearnVideoJS.resizeVideoPlayer(div);
    });
    eLearnVideoJS.videoCheckDelayedError(div);
};

eLearnVideoJS.onMouseUp = function(event) {
    if(eLearnVideoJS.videoVolumeMouseDownTarget != null) {
        event.preventDefault();
        event.stopImmediatePropagation();
        eLearnVideoJS.setVideoVolumeMouseDown(eLearnVideoJS.videoVolumeMouseDownTarget, false, event);
        return false;
    }
    else if((event.type === "touchend" || event.button == 0) && eLearnVideoJS.videoProgressMouseDown) {
        if(eLearnVideoJS.videoProgressMouseDownTarget != null) {
            event.preventDefault();
            event.stopImmediatePropagation();
            if(!eLearnVideoJS.videoOverProgress) eLearnVideoJS.videoProgressMouseDownTarget.find('.progress-hover-time').remove();
            eLearnVideoJS.setVideoMouseDown(eLearnVideoJS.videoProgressMouseDownTarget, false);
        }
        return false;
    }
    else {
        return true;
    }
};

/**
* Sets the language for all elements.
*/
eLearnVideoJS.setLanguage = function(langCode) {
    langCode = langCode.toLowerCase();
    if(eLearnVideoJS.localization[langCode] !== undefined) {
        eLearnVideoJS.selectedLocale = langCode;
        $('[lang-code],[lang-code-title],[lang-code-tab],[lang-code-placeholder]').each(function(i,e) {
            eLearnVideoJS.localizeElement($(e));
        });

        // additional updates
        eLearnVideoJS.resizeAllVideoPlayers();
        eLearnVideoJS.videoUpdateTimeleftDuration();
        $('.elearnjs-video').each(function(i,e) {
            eLearnVideoJS.videoUpdatePlayPauseButton($(e));
            eLearnVideoJS.updateVideoUserNoteTime($(e));
        })
    }
    else {
        throw "Unsupported language selected. Supported language codes are: "  + Object.keys(eLearnVideoJS.localization).toString();
    }
};
eLearnVideoJS.selectLanguage = eLearnVideoJS.setLanguage;

/**
* Localizes one specific element to match the selected language.
* The selected language is the eLearnVideoJS.selectedLocale if not specific
* `lang` attribute is present in the HTML element
*/
eLearnVideoJS.localizeElement = function(el, force) {
    if($(el).attr('localized') === "false" && !force) return;

    var loc = eLearnVideoJS.selectedLocale;
    if(el.closest('[lang]').length) {
        var lang = el.closest('[lang]').attr('lang').toLowerCase();
        if(eLearnVideoJS.localization[lang]) loc = lang;
    }

    if(el.attr("lang-code")) {
        var text = eLearnVideoJS.localization[loc][el.attr("lang-code")];
        if(text) {
            if($(el).attr('localized') === "html") el.html(text);
            else el.text(text);
        }
    }

    if(el.attr("lang-code-title")) {
        var text = eLearnVideoJS.localization[loc][el.attr("lang-code-title")];
        if(text) {
            el.attr('title', text);
        }
    }

    if(el.attr("lang-code-tab")) {
        var text = eLearnVideoJS.localization[loc][el.attr("lang-code-tab")];
        if(text) {
            var index = el.parent().children().index(el);
            var tabs = el.closest('.tabbed-container').children('.tabs').children('.tab-select');
            tabs.eq(index).text(text);
        }
    }

    if(el.attr("lang-code-placeholder")) {
        var text = eLearnVideoJS.localization[loc][el.attr("lang-code-placeholder")];
        if(text) {
            el.attr('placeholder', text);
        }
    }
};

/**
* Localizes all children of an element.
* Will not localize the element itself.
*/
eLearnVideoJS.localizeChildren = function(el, force) {
    el.find('[lang-code],[lang-code-title],[lang-code-tab]').each(function(i,e) {
        eLearnVideoJS.localizeElement($(e), force);
    });
};

eLearnVideoJS.getLocalizationFor = function(code) {
    var loc = eLearnVideoJS.selectedLocale;
    if($('html').attr('lang')
            && eLearnVideoJS.localization[$('html').attr('lang').toLowerCase()] !== undefined) {
        loc = $('html').attr('lang').toLowerCase();
    }
    return eLearnVideoJS.localization[loc][code];
}


/**
* Checks for browser specific adjustments to the video player.
* E.G. mobile safari does not allow volume changes. These elements are hidden.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoCheckForBrowserSpecifics = function(div) {
    var device = "";
    var ua = navigator.userAgent.toLowerCase();
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        device = "ios";
    }

    if(device === "ios") {
        // hide volume, because it doesn't work on iOs
        div.find('.volume').hide()
    }
};


// HOVER ---------------------------------------------------

/**
* Toggles the hover overlay of one specific video wrapper.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoToggleHover = function(div) {
    if(div.is('.hovered')) {
        eLearnVideoJS.videoHoverEnd(div);
    }
    else {
        eLearnVideoJS.videoHover(div);
    }
};

/**
* Checks if the eLearnVideoJS.videoHover should be refreshed based on the given events target.
* Refreshes the hover if so.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoRefreshHover = function(div, event) {
    var trgt = $(event.target);
    if(trgt.is('.mobile-overlay *') || trgt.is('.controls *')) {
        eLearnVideoJS.videoHover(div);
    }
};

/**
* Sets a video player hovered. Will show the controls overlay.
* Initiates a timeout for automatic hiding of the overlay after a hard coded
* time.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoHover = function(div) {
    if(!div.is(".hovered")) {
        div.addClass("hovered");
    }
    var vid = div.find('video')[0];
    var idx = $('.elearnjs-video').index(div);
    if(eLearnVideoJS.video_hover_timers[idx] != undefined) clearTimeout(eLearnVideoJS.video_hover_timers[idx]);
    if(!(vid.paused && div.is('.mobile'))) {
        eLearnVideoJS.video_hover_timers[idx] = setTimeout(function(){
            if(eLearnVideoJS.videoProgressMouseDown || eLearnVideoJS.videoVolumeMouseDown) {
                eLearnVideoJS.videoHover(div);
            }
            else {
                eLearnVideoJS.videoHoverEnd(div);
            }
        }, 2500);
    }
};

/**
* Removes the hover overlay for a specific video player.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoHoverEnd = function(div) {
    var vid = div.find('video')[0];
    if(!vid.ended) {
        div.removeClass("hovered");
    }
};

// FULLSCREEN -----------------------------------------------

/**
* Checks if the browser is in fullscreen mode. If not all video players are
* reset to normal display mode.
*/
eLearnVideoJS.checkVideoFullscreen = function() {
    var isFullScreen = document.fullScreen ||
                   document.mozFullScreen ||
                   document.webkitIsFullScreen;

    if(!isFullScreen) {
        $('.elearnjs-video').removeClass("full");
    }
};

// BUTTONS --------------------------------------------------

eLearnVideoJS.videoFullscreenPending = {};

/**
* Called when clicked on a video.
* This will pause or check for double click and set the video to fullscreen/back
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoOnClick = function(div) {
    var dblclick_time = 250;
    var idx = $('.elearnjs-video').index(div);

    if(eLearnVideoJS.videoFullscreenPending[idx] == undefined
        || eLearnVideoJS.videoFullscreenPending[idx] === false) {
        eLearnVideoJS.videoFullscreenPending[idx] = true;
        // reset double click wait
        setTimeout(function() {
            // if still pending
            if(eLearnVideoJS.videoFullscreenPending[idx] === true) {
                eLearnVideoJS.videoTogglePlay(div);
                eLearnVideoJS.videoFullscreenPending[idx] = false;
            }
        }, dblclick_time);
    }
    else if(eLearnVideoJS.videoFullscreenPending[idx] === true){
        // reset
        eLearnVideoJS.videoFullscreenPending[idx] = false;
        eLearnVideoJS.videoToggleFullscreen(div);
    }
};

/**
* Toggles play for a video player. Updates the playpause button
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoTogglePlay = function(div) {
    var vid = div.find('video')[0];
    var btn = div.find('.playpause')[0];

    if(vid.playbackRate === 0) {
        vid.playbackRate = 1;
    }

    // paused now -> play
    if(vid.paused || vid.ended) {
        vid.play();
    }
    // pause
    else {
        vid.pause();
    }

    eLearnVideoJS.videoUpdatePlayPauseButton(div);
};

/**
* Updates the play/pause button based on the video play-status.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoUpdatePlayPauseButton = function(div) {
    var vid = div.find('video')[0];

    // paused now -> play
    if(vid.paused || vid.ended) {
        div.find('.playpause').attr("title", eLearnVideoJS.getLocalizationFor("play"));
        div.find('.playpause').removeClass("playing");
        div.find('.playpause').addClass("paused");
    }
    // pause
    else {
        div.find('.playpause').attr("title", eLearnVideoJS.getLocalizationFor("pause"));
        div.find('.playpause').addClass("playing");
        div.find('.playpause').removeClass("paused");
    }
};

/**
* Toggles between the display of timeleft (e.g. -0:12) and the videos duration
* (e.g. 0:28, static)
*/
eLearnVideoJS.videoToggleTimeleftDuration = function() {
    eLearnVideoJS.video_timestyle = (eLearnVideoJS.video_timestyle + 1) % 2;

    eLearnVideoJS.videoUpdateTimeleftDuration();
};

/**
* Toggles between the display of timeleft (e.g. -0:12) and the videos duration
* (e.g. 0:28, static)
*/
eLearnVideoJS.videoUpdateTimeleftDuration = function() {
    var timeleft_field = $('.timeleft');

    var title = "";
    switch(eLearnVideoJS.video_timestyle) {
        case eLearnVideoJS.video_timetypes.DURATION:
            title = eLearnVideoJS.getLocalizationFor("duration"); break;
        case eLearnVideoJS.video_timetypes.TIMELEFT:
            title = eLearnVideoJS.getLocalizationFor("timeleft"); break;
    }
    timeleft_field.attr("title", title);

    $('.elearnjs-video').each(function(i,e) {
        eLearnVideoJS.updateVideoTime($(e));
    });
};

/**
* Toggles fullscreen for a video player.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoToggleFullscreen = function(div) {
    // to fullscreen
    if(!div.is(".full")) {
        var elem = div[0];
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.webkitEnterFullscreen) {
            elem.webkitEnterFullscreen();
        } else {
            elem = div.find('video')[0];
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.webkitEnterFullscreen) {
                elem.webkitEnterFullscreen();
            } else {
                alert('No Fullscreen Support.')
                return;
            }
            return;
        }
        div.addClass("full");
    }
    else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        div.removeClass("full");
    }
};

// VOLUME --------------------------------------------------

eLearnVideoJS.withinVolumeControl = false;
eLearnVideoJS.videoVolumePending = {};
eLearnVideoJS.videoVolumeMouseDown = false;
eLearnVideoJS.videoVolumeMouseDownTarget = null;

/**
* Called when clicked on the volume icon
* should open volume control on touch devices and mute/unmute otherwise
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoVolumeClick = function(div, e) {
    var vid = div.find('video')[0];
    var idx = $('.elearnjs-video').index(div);

    if(e.type === "touchend") {
        eLearnVideoJS.touchend_block = true;
        clearTimeout(eLearnVideoJS.touchend_timer);
        eLearnVideoJS.touchend_timer = setTimeout(function() {eLearnVideoJS.touchend_block = false;}, 100);
    }

    if(e.type === "touchend" || !eLearnVideoJS.touchend_block) {
        if(div.is('.mobile')) {
            eLearnVideoJS.videoSetVolumeControlOpen(div, !div.find('.volume').is('.controlopen'));
        }
        else if($(e.target).is('.icon') && !eLearnVideoJS.videoVolumeMouseDown) {
            if(vid.volume > 0) {
                eLearnVideoJS.video_volumes[idx] = vid.volume;
                vid.volume = 0;
            }
            else if(eLearnVideoJS.video_volumes[idx] != undefined && eLearnVideoJS.video_volumes[idx] > 0){
                vid.volume = eLearnVideoJS.video_volumes[idx];
            }
            // should never happen
            else {
                vid.volume = 0.5;
            }
        }
    }
};

/**
* Called when hovering over the volume icon
* shouldn't do anything on touch devices, because they have no hover
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoVolumeHover = function(div, event) {
    if(!div.is('.mobile')) {
        if(event.type === "mouseenter") {
            eLearnVideoJS.withinVolumeControl = true;
            eLearnVideoJS.videoSetVolumeControlOpen(div, true);
        }
        else if(event.type === "mouseleave") {
            eLearnVideoJS.withinVolumeControl = false;
            if(!eLearnVideoJS.videoVolumeMouseDown) {
                eLearnVideoJS.videoSetVolumeControlOpen(div, false);
            }
        }
    }
};

/**
* Opens or closes the Volume Control
* is called by eLearnVideoJS.videoVolumeHover, eLearnVideoJS.videoVolumeClick and eLearnVideoJS.setVideoVolumeMouseDown
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoSetVolumeControlOpen = function(div, bool) {
    var idx = $('.elearnjs-video').index(div);
    if(bool) {
        var controls = div.find('.controls');
        var volume = controls.find('.volume');
        if(!volume.is('.controlopen')) {
            clearTimeout(eLearnVideoJS.videoVolumePending[idx]);
            volume.addClass('hovered');
            volume[0].offsetHeight; // to force css change
            volume.addClass('controlopen');
        }
    }
    else {
        var controls = div.find('.controls');
        var volume = controls.find('.volume');
        if(volume.is('.controlopen')) {
            volume.removeClass('controlopen');
            eLearnVideoJS.videoVolumePending[idx] = setTimeout(function() {
                volume.removeClass('hovered');
            }, 115); /* based on transition time, calculated by sizes */
        }
    }
};

/**
* Called when moving the mouse over any .elearnjs-video (@param: div)
* Used to apply volume changes
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoProgressVolumeMouseMove = function(div, e) {
    if(eLearnVideoJS.videoVolumeMouseDown) {
        e.preventDefault();
        e.stopPropagation();

        eLearnVideoJS.videoHover(div);

        var vid = div.find('video')[0];
        var volume = div.find('.volume');
        var pos = 0;
        if(e.type.toLowerCase() === "mousemove"
            || e.type.toLowerCase() === "mousedown") {
            pos = e.originalEvent.pageY - volume.find('.volume-wrap').offset().top;
        }
        else if(e.type.toLowerCase() === "touchmove"
                || e.type.toLowerCase() === "touchstart"){
            pos = e.originalEvent.touches[0].pageY - volume.find('.volume-wrap').offset().top;
        }

        var perc = pos/volume.find('.volume-wrap').height();
        if(perc < 0) perc = 0;
        if(perc > 1) perc = 1;

        vid.volume = 1-perc;
    }
};

/**
* Used to set volume change active or not.
* @param div: the .elearnjs-video Wrapper of the video element.
* @param e: the event occured initiating this. (mousedown/touchstart...)
*/
eLearnVideoJS.setVideoVolumeMouseDown = function(div, bool, e) {
    eLearnVideoJS.videoVolumeMouseDown = bool;
    if(bool) {
        eLearnVideoJS.videoVolumeMouseDownTarget = div;
        // instant position calculation
        eLearnVideoJS.videoProgressVolumeMouseMove(div, e);
    }
    else {
        if(!eLearnVideoJS.withinVolumeControl && !div.is('.mobile')) {
            eLearnVideoJS.videoSetVolumeControlOpen(div, false);
        }
        // add volume to last volume
        var vid = div.find('video')[0];
        if(vid.volume > 0) {
            var idx = $('.elearnjs-video').index(div);
            eLearnVideoJS.video_volumes[idx] = vid.volume;
        }
        eLearnVideoJS.videoVolumeMouseDownTarget = null;
    }
};


/**
* Called when the video within the div has a volume change
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.updateVideoVolume = function(div) {
    var vid = div.find('video')[0];
    var btn = div.find('.volume').find('.icon');
    var volume = div.find('.volume');
    volume.find('.volume-control').css('top', (1-vid.volume)*100 + "%");

    btn.removeClass("mute");
    btn.removeClass("low");
    btn.removeClass("medium");
    btn.removeClass("high");

    if(vid.volume == 0) {
        btn.addClass("mute");
    }
    else if(vid.volume < 0.33){
        btn.addClass("low");
    }
    else if(vid.volume < 0.66) {
        btn.addClass("medium");
    }
    else {
        btn.addClass("high");
    }
};

// VIDEO KEYBOARD EVENTS ------------------------------------

/**
* Processes a keydown event on a video player. The player needs to be target
* of the event so this is triggered. (e.g. Space to toggle play/pause)
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoKeyDown = function(div, event) {
    var keyCode = event.keyCode || event.which;

    // space
    if(keyCode === 32) {
        event.preventDefault();
        event.stopImmediatePropagation();
        eLearnVideoJS.videoTogglePlay(div);
        eLearnVideoJS.videoHover(div);
    }
    // left arrow
    else if(keyCode === 37) {
        event.preventDefault();
        event.stopImmediatePropagation();
        eLearnVideoJS.videoKeyTimeChange(div, -5000);
    }
    else if(keyCode === 39) {
        event.preventDefault();
        event.stopImmediatePropagation();
        eLearnVideoJS.videoKeyTimeChange(div, 5000);
    }
};

/**
* Changes the current video time of the video contained in the div
* by `timeChange`.
*
* @param div: the .elearnjs-video Wrapper of the video element.
* @param timeChange: int, the time to be added in ms. e.g. `5000` for +5 seconds
*/
eLearnVideoJS.videoKeyTimeChange = function(div, timeChange) {
    div.find('video').get(0).currentTime += (timeChange / 1000);
    eLearnVideoJS.videoHover(div);
};

// PROGRESSBAR ----------------------------------------------

eLearnVideoJS.videoOverProgress = false;
eLearnVideoJS.videoProgressMouseDownTarget = null;
eLearnVideoJS.videoProgressMouseDown = false;
eLearnVideoJS.videoSpeedBefore = 1;

/**
* Sets video mouse down state enabled or disabled.
* Used the progress mousemove/touchmove events on the player
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.setVideoMouseDown = function(div, b) {
    var vid = div.find('video')[0];
    if(b && !eLearnVideoJS.videoProgressMouseDown) {
        eLearnVideoJS.videoProgressMouseDownTarget = div;
        eLearnVideoJS.videoSpeedBefore = vid.playbackRate;
        vid.playbackRate = 0;
        div.find('.video-progress-bar').addClass('notransition');
        div.find('.video-progress-pointer').addClass('notransition');
        eLearnVideoJS.videoProgressMouseDown = b;
    }
    else if(!b && eLearnVideoJS.videoProgressMouseDown) {
        if(eLearnVideoJS.videoSpeedBefore != vid.playbackRate) {
            eLearnVideoJS.videoProgressMouseDownTarget = null;
            vid.playbackRate = eLearnVideoJS.videoSpeedBefore;
        }
        div.find('.video-progress-bar')[0].offsetHeight;
        div.find('.video-progress-pointer')[0].offsetHeight;
        div.find('.video-progress-bar').removeClass('notransition');
        div.find('.video-progress-pointer').removeClass('notransition');
        eLearnVideoJS.videoProgressMouseDown = b;
        eLearnVideoJS.updateVideoTime(div);
    }
};

/**
* Processes a mouse enter event on the progress bar.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoProgressMouseEnter = function(div, e) {
    var con = div.find('.video-progress-con');
    var back = con.find('.video-progress');
    back.append('<div class="video-progress-hover">');
    div.append('<div class="progress-hover-time"></div>');
    eLearnVideoJS.videoOverProgress = true;
};

/**
* Processes a mouse leave event on the progress bar.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoProgressMouseLeave = function(div, e) {
    var con = div.find('.video-progress-con');
    con.find('.video-progress-hover').remove();
    if(!eLearnVideoJS.videoProgressMouseDown) div.find('.progress-hover-time').remove();
    eLearnVideoJS.videoOverProgress = false;
};

/**
* Processes a mouse move event on the video player if either the event is
* targeted at the progressbar or the state eLearnVideoJS.videoProgressMouseDown is true.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoProgressMouseMove = function(div, e) {
    var vid = div.find('video')[0];
    if(eLearnVideoJS.videoOverProgress || eLearnVideoJS.videoProgressMouseDown) {
        var pos = 0;

        if(eLearnVideoJS.videoProgressMouseDown) {
            e.preventDefault();
            e.stopPropagation();
            eLearnVideoJS.videoHover(div); // additional since other event is prevented
        }

        if(e.type.toLowerCase() === "mousemove"
            || e.type.toLowerCase() === "mousedown") {
            pos = e.originalEvent.pageX - div.find('.video-progress').offset().left;
        }
        else if(e.type.toLowerCase() === "touchmove"
                || e.type.toLowerCase() === "touchstart"){
            pos = e.originalEvent.touches[0].pageX - div.find('.video-progress').offset().left;
        }

        if(pos < 0) pos = 0;
        if(pos > div.find('.video-progress').width()) pos = div.find('.video-progress').width();

        var pos_perc = pos / div.find('.video-progress').width();
        div.find('.video-progress-hover').css("width", pos_perc*100 + "%");

        if(eLearnVideoJS.videoProgressMouseDown) {
            // change position without transition effect
            div.find('.video-progress-bar').css("width", pos_perc*100 + "%");
            div.find('.video-progress-pointer').css("left", pos_perc*100 + "%");
            vid.currentTime = vid.duration * pos_perc;
        }
    }
    div.find('.progress-hover-time').html(eLearnVideoJS.createTimeStringColons(pos_perc * vid.duration));
    div.find('.progress-hover-time').css('left', pos + div.find('.video-progress-con')[0].offsetLeft);
    div.find('.progress-hover-time').css('margin-left', "-" + (div.find('.progress-hover-time').outerWidth() / 2) + "px");
};

// GENERAL VIDEO PLAYER -------------------------------------

/**
* Updates the video time. Will set the time indicator and progressbar width
* to values based on the video elements currentTime
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.updateVideoTime = function(div) {
    var vid = div.find('video')[0];
    var time_field = div.find('.playtime');
    var timeleft_field = div.find('.timeleft');

    var time = vid.currentTime;
    var timeleft = Math.floor(vid.duration) - Math.floor(vid.currentTime);

    // time fields
    if(!eLearnVideoJS.videoProgressMouseDown) {
        time_field.html(eLearnVideoJS.createTimeStringColons(time));
        if(eLearnVideoJS.video_timestyle === eLearnVideoJS.video_timetypes.TIMELEFT) {
            if(!isNaN(timeleft)) timeleft_field.html("-" + eLearnVideoJS.createTimeStringColons(timeleft));
        }
        else if(eLearnVideoJS.video_timestyle === eLearnVideoJS.video_timetypes.DURATION) timeleft_field.html(eLearnVideoJS.createTimeStringColons(vid.duration));
    }

    // progress bar
    var progress_bar = div.find('.video-progress-bar');
    progress_bar.css("width", (vid.currentTime*100)/vid.duration + "%");
    div.find('.video-progress-pointer').css("left",
                                    (vid.currentTime*100)/vid.duration + "%");

    // buffered bar
    var latest_end = 0;
    for(var i=0; i<vid.buffered.length; i++) {
        if(vid.buffered.end(i) > latest_end) {
            latest_end = vid.buffered.end(i);
        }
    }
    var buffered_perc = latest_end / vid.duration;
    div.find('.video-progress-loaded').css("width", buffered_perc*100 + "%");
};

/**
* Processes a video error. Will show an error overlay.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoOnError = function(div, event) {
    div.append('<div class="error-con">');
    var errormsg = $('<span lang-code="error" localized="html"></span>')
    div.find('.error-con').append(errormsg);
    eLearnVideoJS.localizeElement(errormsg);
    div.find('.error-con').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        div.find('video')[0].load();
        eLearnVideoJS.videoRemoveError(div);
        eLearnVideoJS.videoCheckDelayedError(div);
    });
};

/**
* Will hide a video error overlay
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoRemoveError = function(div, event) {
    div.find('.error-con').remove();
};

/**
* Checks for a delayed error. Will check after 1s.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoCheckDelayedError = function(div) {
    setTimeout(function() {
        var vid = div.find('video')[0];
        if(vid.networkState === 3) {
            eLearnVideoJS.videoOnError(div);
        }
        else {
            eLearnVideoJS.videoRemoveError(div);
        }
    }, 1000);
};

/**
* Displays a loading indicator when a buffer event is triggered.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoOnBuffering = function(div, event) {
    if(div.find('.play-overlay').length == 0) {
        if(div.is('.mobile')) div.find('.mobile-overlay').hide();
        div.find('.loading-overlay').show();
    }
};

/**
* Hides the loading indicator, when the video is not buffering anymore.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.videoRemoveBuffering = function(div, event) {
    if(div.find('.play-overlay').length == 0) {
        if(div.is('.mobile')) div.find('.mobile-overlay').show();
        div.find('.loading-overlay').hide();
    }
};

/**
* Resizes all video Players. Will call eLearnVideoJS.resizeVideoPlayer simply on all
* .elearnjs-video elements.
*/
eLearnVideoJS.resizeAllVideoPlayers = function() {
    $('.elearnjs-video:visible').each(function(i,e) {
        eLearnVideoJS.resizeVideoPlayer($(this));
    });
};

/**
* Recalculates video note container widths. for every video.
*/
eLearnVideoJS.resizeVideoPlayer = function(div) {
    var videoContainer = div.closest('.video-container');
    videoContainer.find('.video_notes_wrapper').css("width", div.find('video').width());
};

/**
* Switches the video player style between mouse and touch for easier control.
* Will be triggered on delayed switches between those based on events.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
eLearnVideoJS.switchTouchMouse = function() {
    if(eLearnVideoJS.isTouchSupported()) {
        $('.elearnjs-video').addClass("mobile");
    }
    else {
        $('.elearnjs-video').removeClass("mobile");
    }
};

// ------------------------- VIDEO NOTES ------------------------------------

eLearnVideoJS.videoNoteTimes = [];

/**
* Initializes the time notes for all video players.
* Will be called in the generell video player initiation.
* Players can have the class "allow_user_notes" which lets them define if
* the allow user notes (class is set) or not (class is not set).
*/
eLearnVideoJS.initiateVideoNotes = function() {
    $('.video_note').addClass('backup');
    $('.video_note').wrapInner('<div class="content">');

    eLearnVideoJS.loadLocalVideoNotesStorage();

    // create list with sorted times for faster checking if something needs to be shown
    $('.elearnjs-video').each(function(idx,e) {
        var videoContainer = $(this).closest('.video-container');
        var videoNotesContainer = $("<div class='video_notes_container'>");
        var videoNotes;
        var userNotes;

        videoContainer.append(videoNotesContainer);

        // No video notes in .html
        if(videoContainer.next('.video_notes').length !== 0) {
            videoNotes = videoContainer.next('.video_notes');
            videoNotesContainer.append(videoNotes);
            videoNotes.addClass("note_container");
            eLearnVideoJS.addShowAllTo(videoNotes);
        }

        // Create user note container
        if(videoContainer.find('.allow_user_notes').length > 0) {
            userNotes = eLearnVideoJS.getUserVideoNotesContainer();
            videoContainer.addClass('allow_user_notes');
            videoNotesContainer.append(userNotes);
            userNotes.addClass("note_container");
            eLearnVideoJS.addShowAllTo(userNotes);
            eLearnVideoJS.addUserNoteMenuTo(userNotes);
            eLearnVideoJS.addVideoUserNoteListeners(videoContainer);
        }

        // Wrap in tabbed box if both are present
        if(videoNotes != undefined && userNotes != undefined) {
            videoNotesContainer.addClass("tabbed-box");

            videoNotes.addClass("tab");
            videoNotes.attr("lang-code-tab", "annotations");

            userNotes.addClass("tab");
            userNotes.attr("lang-code-tab", "usernotes");

            eLearnVideoJS.initiateTabbedBox(videoNotesContainer);

            videoNotesContainer.closest(".tabbed-container").addClass("video_notes_wrapper");
        }
        else {
            videoNotesContainer.addClass("video_notes_wrapper");
        }

        var video_user_notes = eLearnVideoJS.getVideoNotesFor(videoContainer.find('video').find('source').first()[0].src);
        // from back to front, since eLearnVideoJS.addNoteToUserNotes adds in front
        if(video_user_notes != undefined) {
            for(var i=video_user_notes.length-1; i>=0; i--) {
                var user_note = video_user_notes[i];
                eLearnVideoJS.addNoteToUserNotes(videoContainer,
                    eLearnVideoJS.createUserNote(user_note.text, user_note.timefrom, user_note.timeto));
            }
        }

        // fetch existing video notes
        eLearnVideoJS.updateUserNotes(videoContainer);

        $(this).find('video').on('timeupdate', function(event) {
            eLearnVideoJS.noteTimeUpdate($(e), videoNotesContainer, idx, event);
        });
    });

    eLearnVideoJS.initiateUserNotes();
};

/**
* Creates and returns a user video notes container
*/
eLearnVideoJS.getUserVideoNotesContainer = function() {
    var userNotes = $('<div class="user_notes timestamps"><h4 lang-code="usernotes"></h4></div>');
    userNotes.append('<div class="note_add_container">'
                        + '<hr>'
                        + '<form accept-charset="UTF-8">'
                        + '<input class="user_note_from" type="text"/>'
                        + '<input class="user_note_to" type="text"/>'
                        + '<textarea class="user_note_text" lang-code-placeholder="placeholder.writenote"></textarea>'
                        + '</form>'
                        + '<button class="note_add" lang-code="notesave"></button>'
                        + '<button class="note_cancel" lang-code="notecancel"></button>'
                        + '</div>');
    userNotes.append('<button class="toggle_note_add" lang-code="noteadd"></button>');

    return userNotes;
};

/**
* Adds the "show all notes" checkbox to a notes container.
*/
eLearnVideoJS.addShowAllTo = function(notes) {
    notes.prepend('<div style="clear: both">');
    notes.prepend('<label class="show_all_notes"><input type="checkbox" name="show_all" value="show_all"/><span lang-code="displayall"></span></label>');

    notes.find('input[name="show_all"]').on('change', function(e) {
        eLearnVideoJS.showAllNotes(notes, $(this).is(':checked'));
    });
};

/**
* Adds the user Note Menu to the user note container.
*/
eLearnVideoJS.addUserNoteMenuTo = function(notes) {
    var div = $('<div class="user_note_menu_wrap general_user_note_menu"><div class="user_note_menu">m</div></div>');
    div.on('click', function() {
        eLearnVideoJS.toggleUserNoteMenu(this);
    });
    notes.prepend(div);
};

/**
* Enables or disables the display of all video notes in the specific notes
* container.
*/
eLearnVideoJS.showAllNotes = function(notes, b) {
    var videoContainer = notes.closest('.video-container');
    var idx = $('.elearnjs-video').index(videoContainer.find('.elearnjs-video'));

    // show all
    if(b) {
        notes.addClass("show_all");
        for(var i=0; i<eLearnVideoJS.videoNoteTimes[idx].length; i++) {
            var info = eLearnVideoJS.videoNoteTimes[idx][i];
            var display_note = notes.find('.video_note').not('.backup').filter('#'+info["index"]);
            if(display_note.length == 0) {
                eLearnVideoJS.showVideoNote(notes, info);
            }
        }
    }
    else if(!b) {
        notes.removeClass("show_all");
        eLearnVideoJS.hideAllVideoNotes(notes);
        eLearnVideoJS.noteTimeUpdate(videoContainer, notes, idx);
    }
};

/**
* Checks if show all is activated. Will display all notes if so.
* Will NOT hide others if not.
*/
eLearnVideoJS.checkShowAll = function(notes_con) {
    notes_con.find('.note_container').each(function(i,e) {
        if($(this).is('.show_all')) {
            eLearnVideoJS.showAllNotes($(this), true);
        }
    });
};

/**
* Adds note indicators to the videos progressbar
* @param videoContainer: the .video-container wrapper around the video
*/
eLearnVideoJS.addNotesToProgressbar = function(videoContainer, index) {
    var vid = videoContainer.find('video')[0];
    var length = vid.duration;

    if(vid.readyState == 0 || vid.duration == 0) {
        setTimeout(function() {eLearnVideoJS.addNotesToProgressbar(videoContainer, index);}, 100);
    }
    else {
        videoContainer.find('.video-progress-con').find('.video-progress-note').remove();
        for(var i=0; i<eLearnVideoJS.videoNoteTimes[index].length; i++) {
            var info = eLearnVideoJS.videoNoteTimes[index][i];
            var start = info['time'];

            var progress_note = $('<div class="video-progress-note">');
            var progress_pos = (start*100)/length;
            if(info['user_note']) progress_note.addClass('user-progress-note');
            progress_note.css('left', progress_pos + "%");
            // add all notes, always, since collisions are always based on the width at this moment
            videoContainer.find('.video-progress').after(progress_note);
        }
    }
};

/**
* Wird beim timeupdate event eines videos ausgeführt. Blendet notes ein oder aus
* @param videoContainer: the .video-container wrapper around the video
* @param notes_con: the video_notes_wrapper
* @param index: index of the .elearnjs-video in all .elearnjs-videos
* @param event: will be used to check if a video has to stop on a note or not
*/
eLearnVideoJS.noteTimeUpdate = function(videoContainer, notes_con, index, event) {
    var vid = videoContainer.find('video')[0];
    var time = vid.currentTime;

    for(var i=0; i<eLearnVideoJS.videoNoteTimes[index].length; i++) {
        var info = eLearnVideoJS.videoNoteTimes[index][i];
        var backup_note = notes_con.find('.video_note.backup').filter('#'+info["index"]);
        var display_note = notes_con.find('.video_note').not('.backup').filter('#'+info["index"]);

        if(!backup_note.closest('.note_container').is('.show_all')) {
            // time not reached
            if(info["time"] > time) {
                // remove
                eLearnVideoJS.hideVideoNote(notes_con, display_note);
            }
            else if(info["time"] <= time) {
                // note ended
                if(info["time_to"] != undefined
                    && info["time_to"] != -1
                    && info["time_to"] <= time) {
                    // remove
                    eLearnVideoJS.hideVideoNote(notes_con, display_note);
                }
                else {
                    // skip if already shown
                    if(display_note.length > 0) continue;
                    // create new node
                    eLearnVideoJS.showVideoNote(notes_con, info, vid, event && event.type === "timeupdate");
                }
            }
        }
    }
    eLearnVideoJS.checkVisibleNotes(videoContainer, notes_con);
};

/**
* Displays a video note specified by its info.
*
* @param notes_con notes container.
* @param info object within the
* @param video (optional) if given, the video might stop or will get an overlay
*              to hint the note
*/
eLearnVideoJS.showVideoNote = function(notes_con, info, video, stopAllowed) {
    var original_note = notes_con.find('.video_note.backup').filter('#'+info["index"]);
    var new_note = original_note.clone(true, true); // clone with all listeners
    new_note.removeClass('backup');
    //new_note.attr('id', info["index"]);

    // timestamp if activated
    if(original_note.closest('.note_container').is('.timestamps')) {
        new_note.prepend('<span class="video_note_timestamp">'
                            +eLearnVideoJS.createTimeStringColons(info["time"])+'</span>');
    }
    // add user note menu button
    if(original_note.is('.user_note')) {
        var div = $('<div class="user_note_menu_wrap"><div class="user_note_menu">m</div></div>');
        div.on('click', function() {
            eLearnVideoJS.toggleUserNoteMenu(this);
        });
        new_note.prepend(div);
    }
    original_note.after(new_note);

    // check for hint display
    if(info.hinted && video) {
        eLearnVideoJS.showVideoNoteHint(video, new_note);
    }
    if(stopAllowed && info.stopping && video) {
        // do not stop on time skip
        if(!eLearnVideoJS.videoProgressMouseDown
                || eLearnVideoJS.videoProgressMouseDownTarget.get(0) !== $(video).closest('.elearnjs-video').get(0)) {
            video.pause();
        }
    }
};

/**
* Hides a @param display_note displayed note within a @param notes_con notes
* container.
*/
eLearnVideoJS.hideVideoNote = function(notes_con, display_note) {
    var backup_note = display_note.siblings('#' + display_note.attr("id") + ".backup");
    backup_note.empty();
    backup_note.append(display_note.find('.content'));
    display_note.remove();
};

/**
* Hides all video notes within a specific container.
*/
eLearnVideoJS.hideAllVideoNotes = function(notes_con) {
    notes_con.find('.video_note').not('.backup').each(function(i,e) {
        eLearnVideoJS.hideVideoNote(notes_con, $(this));
    });
};

eLearnVideoJS.showVideoNoteHint = function(video, note) {
    const videoContainer = $(video).closest('.video-container');
    const div = $(video).closest('.elearnjs-video');
    const vid = video;
    const parent = $(vid).parent();
    const note_const = note;

    if(parent.has('.note-hint-con').length) {
        parent.children('.note-hint-con').remove();
    }

    if(!parent.has('.note-hint-con').length) {
        const con = $('<div class="note-hint-con">');

        var hint = $('<div class="note-hint">');
        con.append(hint);
        var hinttext = $('<span lang-code="notehint">');
        hint.append(hinttext);

        // prevent mouseup/down events
        hint.on('mousedown mouseup', function(event) {
            event.stopImmediatePropagation();
            event.preventDefault();
            return false;
        });

        hint.on('click', function(event) {
            event.stopImmediatePropagation();
            event.preventDefault();

            // pause the video
            vid.pause();
            // stop fullscreen if necessary
            if(div.is('.full')) eLearnVideoJS.videoToggleFullscreen(div);
            // display tab if necessary
            if(videoContainer.find('.tabs').length) {
                eLearnVideoJS.selectTab(videoContainer.find('.tabs').children().first());
            }
            // scroll to note
            if(note_const.is(':visible')
                    && !eLearnVideoJS.isScrolledIntoView(note_const)) {
                note_const.get(0).scrollIntoView();
            }

            note.addClass("emphasized");

            con.remove();
            return false;
        });

        var close = $('<span class="note-hint-close">');
        hint.append(close);

        close.on('click', function(event) {
            event.stopImmediatePropagation();
            event.preventDefault();
            con.remove();
            return false;
        });

        parent.append(con);
        eLearnVideoJS.localizeElement(hinttext);
    }
}

/**
* Checks if atleast one note is displayed. Sets the
* @param videoContainer's class based on that.
*/
eLearnVideoJS.checkVisibleNotes = function(videoContainer, notes_con) {
    if(notes_con.find('.video_note').not('.backup').length > 0) {
        videoContainer.parent().addClass('noted_video');
    }
    else {
        videoContainer.parent().removeClass('noted_video');
    }

    // hide video note hints, if all hinted notes are hidden
    if(notes_con.closest('.video_notes_container ').find('.video_note.hinted').not('.backup').length === 0) {
        videoContainer.find('.note-hint-con').remove();
    }
};

eLearnVideoJS.lastIndexSet = -1;

/**
* Erstellt ein sortiertes Array mit Objekten die einen Index haben, der auf ein
* .video_note objekt hinweist, eine anfangszeit time und ggf. eine time_to.
* Sortiert ist das Array nach dem key "time"
* @param videoContainer: the .video-container wrapper around the video
*/
eLearnVideoJS.getVideoNoteTimeArray = function(videoContainer) {
    var times = [];
    videoContainer.find('.video_note.backup').each(function(i,e) {
        var timeFrom = $(this).attr('timefrom');
        var timeTo = $(this).attr('timeto');
        var user_note = $(this).is(".user_note");

        // get and set id on backup note
        var id = $(this).attr("id");
        if(id == undefined || id.length == 0 || id == "undefined") {
            eLearnVideoJS.lastIndexSet++
            id = eLearnVideoJS.lastIndexSet;
            $(this).attr("id", id);
        }

        if(timeTo == undefined) timeTo = -1;
        times.push({"time" : eLearnVideoJS.parseTimeString(timeFrom),
                    "time_to" : eLearnVideoJS.parseTimeString(timeTo),
                    "user_note" : user_note,
                    "hinted" : $(this).is('.hinted'),
                    "stopping" : $(this).is('.stopping'),
                    "index" : id});
    });
    times.sort(function(a,b) {
        return a["time"]-b["time"];
    });
    return times;
};


// --------------- User Notes ----------------

// container div in which a note is edited (jquery object)
eLearnVideoJS.editingDiv = null;
// the note being edited (jquery object)
eLearnVideoJS.editingNote = null;

eLearnVideoJS.userNoteMenuNode = null;

/**
* Initiates the general user note functionality by adding global event
* listeners.
*/
eLearnVideoJS.initiateUserNotes = function() {
    eLearnVideoJS.addUserNoteListeners();
};
/**
* Adds general listeners used for user note functionality
*/
eLearnVideoJS.addUserNoteListeners = function() {
    $(document).on('click', function(e) {
        if($('.user_note_dropdown').length > 0
            &&!$(e.target).is('.user_note_menu_wrap')
            && !$(e.target).is('.user_note_menu_wrap *')) {
            eLearnVideoJS.hideUserNoteMenu();
        }
    });
};

/**
* Updates all displayed values based on the notes withing the videoContainers
* user note container.
* Updates internal array info values about notes, adds notes to progressbar,
* hides/shows necessary notes.
* @param videoContainer: the .video-container wrapper around the video
*/
eLearnVideoJS.updateUserNotes = function(videoContainer) {
    // fetch existing video notes
    var notes_con = videoContainer.find('.video_notes_container');
    var idx = $('.elearnjs-video').index(videoContainer.find('.elearnjs-video'));
    eLearnVideoJS.videoNoteTimes[idx] = eLearnVideoJS.getVideoNoteTimeArray(notes_con);
    eLearnVideoJS.hideAllVideoNotes(notes_con);
    eLearnVideoJS.noteTimeUpdate(videoContainer, notes_con, idx);
    eLearnVideoJS.checkShowAll(notes_con);
    eLearnVideoJS.addNotesToProgressbar(videoContainer, idx);
};

/**
* Adds listeners for the user note add functionality
* @param videoContainer: the .video-container wrapper around the video
*/
eLearnVideoJS.addVideoUserNoteListeners = function(videoContainer) {
    videoContainer.find('.toggle_note_add').on('click', function() {
        eLearnVideoJS.setVideoNotesAddContainerVisible(videoContainer, true);
    });

    videoContainer.find('.note_add').on('click', function() {
        eLearnVideoJS.saveVideoNote(videoContainer);
    });

    videoContainer.find('.note_cancel').on('click', function() {
        eLearnVideoJS.setVideoNotesAddContainerVisible(videoContainer, false);
    });
};

/**
* Shows/Hides the "add user note"-container.
*/
eLearnVideoJS.setVideoNotesAddContainerVisible = function(videoContainer, bool) {
    if(bool) {
        videoContainer.find('.note_add_container').show();
        videoContainer.find('.toggle_note_add').hide();
    }
    else {
        videoContainer.find('.note_add_container').hide();
        videoContainer.find('.toggle_note_add').show();
        eLearnVideoJS.cancelEdits(videoContainer);
    }
};

/**
* Creates the user note dom element based on the necessary values.
* @param text: the note text
* @param timefrom: time where the note will be displayed
* @param timeto: time where the note will be hidden
* @param id: the id within the current note context. This might be set later
*   by other functions. (e.g. eLearnVideoJS.getVideoNoteTimeArray)
*/
eLearnVideoJS.createUserNote = function(text, timefrom, timeto, id) {
    return $('<div class="video_note backup user_note" timefrom="'
                    + eLearnVideoJS.createTimeStringLetters(eLearnVideoJS.parseTimeString(timefrom))
                    + '" timeto="'
                    + eLearnVideoJS.createTimeStringLetters(eLearnVideoJS.parseTimeString(timeto))
                    + '" id="' + id + '">'
                    + '<div class="content">' + text + '</content>'
                    + '</div>');
};

/**
* Appends a given @param note dom element to the user notes within the videoContainer
* @param videoContainer: the .video-container wrapper around the video
*/
eLearnVideoJS.addNoteToUserNotes = function(videoContainer, note) {
    var existingNotes = videoContainer.find('.user_notes').find('.video_note');
    if(existingNotes.length > 0) {
        // always at first possible position
        videoContainer.find('.user_notes').find('.video_note').first().before(note);
    }
    else {
        videoContainer.find('.note_add_container').before(note);
    }
};

/**
* Processes the input in the note add container.
* Will add/save the note if input is correct.
* @param videoContainer: the .video-container wrapper around the video
*/
eLearnVideoJS.saveVideoNote = function(videoContainer) {
    var noteAddContainer = videoContainer.find('.note_add_container');
    var fr = noteAddContainer.find('.user_note_from').val();
    var to = noteAddContainer.find('.user_note_to').val();
    var text = noteAddContainer.find('.user_note_text').val();

    if(fr.length == 0) {
        fr = noteAddContainer.find('.user_note_from').attr("placeholder").replace(/^\D*/g, "");
    }
    if(to.length == 0) {
        to = noteAddContainer.find('.user_note_to').attr("placeholder").replace(/^\D*/g, "");
    }

    if(text.length == 0) {
        alert(eLearnVideoJS.getLocalizationFor("alert.notenotext"));
        return;
    }
    else if(eLearnVideoJS.parseTimeString(fr) == undefined) {
        alert(eLearnVideoJS.getLocalizationFor("alert.noteinvalidstart"));
        return;
    }
    else if(eLearnVideoJS.parseTimeString(to) == undefined) {
        alert(eLearnVideoJS.getLocalizationFor("alert.noteinvalidend"));
        return;
    }

    text = text.trim().replace(/\r/g, "").replace(/\n/g, "<br>");

    var element = eLearnVideoJS.createUserNote(text, fr, to);

    if(!videoContainer.is(eLearnVideoJS.editingDiv) || eLearnVideoJS.editingNote == null) {
        eLearnVideoJS.addNoteToUserNotes(videoContainer, element);
    }
    else {
        eLearnVideoJS.editingNote.replaceWith(element);
    }
    eLearnVideoJS.cancelEdits(videoContainer);

    eLearnVideoJS.updateUserNotes(videoContainer);
    eLearnVideoJS.updateUserNotesArray(videoContainer);

    eLearnVideoJS.setVideoNotesAddContainerVisible(videoContainer, false);
};

/**
* Called when a dispalyed note is edited (ui call by the user)
* @param videoContainer: the .video-container wrapper around the video
* @param note: the BACKUP note of the edited note.
*/
eLearnVideoJS.editNote = function(videoContainer, note) {
    eLearnVideoJS.editingDiv = videoContainer;
    eLearnVideoJS.editingNote = note;

    var text = eLearnVideoJS.editingNote.find('.content').html().trim().replace(/<br>/g, "\r\n");

    videoContainer.find('.note_add_container').find('.user_note_from').val(eLearnVideoJS.createTimeStringColons(eLearnVideoJS.parseTimeString(eLearnVideoJS.editingNote.attr("timefrom"))));
    videoContainer.find('.note_add_container').find('.user_note_to').val(eLearnVideoJS.createTimeStringColons(eLearnVideoJS.parseTimeString(eLearnVideoJS.editingNote.attr("timeto"))));
    videoContainer.find('.note_add_container').find('textarea').val(text);

    eLearnVideoJS.setVideoNotesAddContainerVisible(videoContainer, true);
};

/**
* Resets the note add container values and the editing variables.
* @param videoContainer: the .video-container wrapper around the video
*/
eLearnVideoJS.cancelEdits = function(videoContainer) {
    videoContainer.find('.note_add_container').find('.user_note_from').val("");
    videoContainer.find('.note_add_container').find('.user_note_to').val("");
    videoContainer.find('.note_add_container').find('textarea').val("");
    eLearnVideoJS.editingDiv = null;
    eLearnVideoJS.editingNote = null;
};

/**
* Deletes a given user note completely within the storage and from the dom
* @param videoContainer: the .video-container wrapper around the video
* @param note: the backup note (might be the displayed note, because only
*   ID is necessary)
*/
eLearnVideoJS.deleteNote = function(videoContainer, note) {
    videoContainer.find('.user_note').filter('#' + note.attr('id')).remove();

    eLearnVideoJS.updateUserNotes(videoContainer);
    eLearnVideoJS.updateUserNotesArray(videoContainer);
};

/**
* Moves a note within the array and dom up or down one step.
* Used to make it possible to arrange the user notes.
* @param videoContainer: the .video-container wrapper around the video
* @param display_note: the displayed version of the note to move
* @param backup_note: the backup version of the note to move
* @param direction: -1: up, 1: down
*/
eLearnVideoJS.moveNote = function(videoContainer, display_note, backup_note, direction) {
    var userNotes = backup_note.closest('.user_notes');

    var idx = userNotes.find('.user_note').not('.backup').index(display_note);
    var newPos = idx + direction;


    // determine position of display_note
    // move up
    if(direction < 0) {
        if(newPos < 0) newPos = 0;
    }
    // move down
    else if(direction > 0) {
        if(newPos > userNotes.find('.user_note').not('.backup').length - 1)
            newPos = userNotes.find('.user_note').not('.backup').length - 1;
    }

    // determine neighbor to align to
    var neighbor = userNotes.find('.user_note').not('.backup').eq(newPos);
    var neighborBackup = userNotes.find('.user_note.backup').filter('#' + neighbor.attr('id'));

    // move display note
    if(direction < 0) {
        neighborBackup.before(display_note);
    }
    // move down
    else if(direction > 0) {
        neighborBackup.after(display_note);
    }

    // move backup_not before display_note
    display_note.before(backup_note);

    eLearnVideoJS.updateUserNotes(videoContainer);
    eLearnVideoJS.updateUserNotesArray(videoContainer);
};

/**
* Creates a user note array for the videoContainer, containing necessary info
* updates this in the local storage.
* @param videoContainer: the .video-container wrapper around the video
*/
eLearnVideoJS.updateUserNotesArray = function(videoContainer) {
    var src = videoContainer.find('video').find('source').first()[0].src;
    var user_video_notes = [];
    videoContainer.find('.user_notes').find('.user_note.backup').each(function(i, e) {
        var text = $(this).find('.content').html();
        var video_note_object = {timefrom: $(this).attr('timefrom'),
                                timeto: $(this).attr('timeto'),
                                text: text};
        user_video_notes.push(video_note_object);
    });
    eLearnVideoJS.setVideoNotesFor(src, user_video_notes);
};

/**
* Updates the placeholder of the time values within the note add container,
* based on the current video time.
* @param div: the .elearnjs-video wrapper around the video
*/
eLearnVideoJS.updateVideoUserNoteTime = function(div) {
    var videoContainer = div.closest('.video-container');
    var noteAddContainer = videoContainer.find('.note_add_container');
    var userNoteFrom = noteAddContainer.find('.user_note_from');
    var userNoteTo = noteAddContainer.find('.user_note_to');

    // default user note duration
    var noteDuration = 10;

    var timeFrom = eLearnVideoJS.parseTimeString(userNoteFrom.val());
    var timeTo = eLearnVideoJS.parseTimeString(userNoteTo.val());

    // Not entered anything
    if(timeFrom == undefined) {
        timeFrom = div.find('video')[0].currentTime;
        userNoteFrom.attr("placeholder",
            eLearnVideoJS.getLocalizationFor("placeholder.start")
            + ": " + eLearnVideoJS.createTimeStringColons(timeFrom));
    }

    if(timeTo == undefined || timeTo < timeFrom) {
        timeTo = timeFrom + noteDuration;
        if(timeTo > div.find('video')[0].duration) {
            timeTo = Math.ceil(div.find('video')[0].duration);
        }
        userNoteTo.attr("placeholder",
            eLearnVideoJS.getLocalizationFor("placeholder.end")
            + ": " + eLearnVideoJS.createTimeStringColons(timeTo));
    }
};

/**
* Starts the import notes process. Opening a filechoser for the user to
* insert a file of exported user notes.
* This can be .json or .csv files.
* @param videoContainer: the .video-container wrapper around the video
*/
eLearnVideoJS.importUserNotes = function(videoContainer) {
    var idx = $('.elearnjs-video').index(videoContainer.find('.elearnjs-video'));

    var fileChoser = $('.user_note_import_filechoser');
    if(fileChoser.length == 0) {
        fileChoser = $('<input type="file" class="user_note_import_filechoser"/>');
        $('body').append(fileChoser);
        fileChoser.on('change', function(e) {
            var overwrite = confirm(eLearnVideoJS.getLocalizationFor("alert.importreset"));
            eLearnVideoJS.importFileChosen(videoContainer, e, overwrite);
            fileChoser.remove();
        });
    }
    fileChoser.trigger('click');
};

/**
* Exports the usernotes to a given filetype. Offers the user a eLearnVideoJS.download of
* the generated file.
* @param videoContainer: the .video-container wrapper around the video
* @param type: either eLearnVideoJS.FILETYPE_JSON or eLearnVideoJS.FILETYPE_CSV
*/
eLearnVideoJS.exportUserNotes = function(videoContainer, type) {
    var idx = $('.elearnjs-video').index(videoContainer.find('.elearnjs-video'));
    var src = videoContainer.find('video').find('source').first()[0].src;
    var text;

    if(eLearnVideoJS.user_notes[src] == undefined || eLearnVideoJS.user_notes[src].length == 0) {
        alert(eLearnVideoJS.getLocalizationFor("alert.nonotes"));
        return;
    }

    if(type === eLearnVideoJS.FILETYPE_JSON) {
        text = JSON.stringify(eLearnVideoJS.user_notes[src]);
    }
    else if(type === eLearnVideoJS.FILETYPE_CSV) {
        text = eLearnVideoJS.getCSVFromJSON(eLearnVideoJS.user_notes[src]);
    }

    eLearnVideoJS.download('user_notes_' + idx + '.' + type, text);
};

/**
* Processes the import file. This will be called, when the filechoser
* returns a chosen file.
* @param videoContainer: the .video-container wrapper around the video
* @param e: the filechoser change event
* @param overwrite: wether current user notes should be deleted (true) or
* imported notes should be appended (false)
*/
eLearnVideoJS.importFileChosen = function(videoContainer, e, overwrite) {
    var src = videoContainer.find('video').find('source').first()[0].src;
    var files = e.target.files;
    var file = files[0];
    var type = file.name.split(".").pop();
    var reader = new FileReader();
    reader.onload = function(event) {
        try {
            var notes;
            if(type === eLearnVideoJS.FILETYPE_JSON) {
                notes = JSON.parse(event.target.result);
            }
            else if(type === eLearnVideoJS.FILETYPE_CSV) {
                notes = JSON.parse(eLearnVideoJS.getJSONFromCSV(event.target.result));
            }
            else {
                throw "Unsupported file type.";
            }
            eLearnVideoJS.user_notes[src] = notes;

            if(overwrite) videoContainer.find('.user_note').remove();

            var video_user_notes = eLearnVideoJS.getVideoNotesFor(src);
            // from back to front, since eLearnVideoJS.addNoteToUserNotes adds in front
            if(video_user_notes != undefined) {
                for(var i=video_user_notes.length-1; i>=0; i--) {
                    var user_note = video_user_notes[i];
                    eLearnVideoJS.addNoteToUserNotes(videoContainer,
                        eLearnVideoJS.createUserNote(user_note.text, user_note.timefrom, user_note.timeto));
                }
            }

            eLearnVideoJS.updateUserNotes(videoContainer);
            eLearnVideoJS.updateUserNotesArray(videoContainer);
            alert(eLearnVideoJS.getLocalizationFor("alert.importsuccess"));
        }
        catch(exc) {
            alert(eLearnVideoJS.getLocalizationFor("alert.importerror"));
        }
    }
    reader.readAsText(file);
};

// ------------ Local Storage ----------

/**
* Loads the user notes from localstorage.
* Will set the "eLearnVideoJS.user_notes" object based on that value.
*/
eLearnVideoJS.loadLocalVideoNotesStorage = function() {
    try {
        var user_notes_str = localStorage.getItem('elearnjs-user-notes');
        if(user_notes_str === null
            || user_notes_str === undefined
            || user_notes_str == "") {
            localStorage.setItem('elearnjs-user-notes', '{}');
            user_notes_str = '{}';
        }
        eLearnVideoJS.user_notes = JSON.parse(user_notes_str);
    }
    catch(e) {
        console.error("LocalStorage could not be cleared.");
    }

};

/**
* Will save the current "eLearnVideoJS.user_notes" object in the local storage.
*/
eLearnVideoJS.updateLocalVideoNotesStorage = function() {
    try {
        if(!localStorage) return;
    }
    catch(e) {
        console.error("Could not access LocalStorage.");
    }
    try {
        localStorage.setItem('elearnjs-user-notes', JSON.stringify(eLearnVideoJS.user_notes));
    }
    catch(e) {
        alert(eLearnVideoJS.getLocalizationFor("alert.localstorageerror"));
    }
};

/**
* Returns the video notes array for the specified video src.
*/
eLearnVideoJS.getVideoNotesFor = function(src) {
    return eLearnVideoJS.user_notes[src];
};

/**
* Saves the given video notes array (@param val) for the specified video src
* in the local storage and updates the "eLearnVideoJS.user_notes" object.
*/
eLearnVideoJS.setVideoNotesFor = function(src, val) {
    eLearnVideoJS.user_notes[src] = val;
    eLearnVideoJS.updateLocalVideoNotesStorage();
};

// User Note Menu

/**
* Creates the user note container menu for import/export ...
* This element will be displayed and positioned on click of the menu button.
*/
eLearnVideoJS.createGeneralUserNoteMenu = function() {
    var dropDownCode = $('<div class="user_note_dropdown general">'
        + '<div class="dropdown_element note_import" lang-code="dropdown.import"></div>'
        + '<div class="dropdown_element note_export" lang-code="dropdown.export"></div>'
        + '<div class="dropdown_element note_export_csv" lang-code="dropdown.exportcsv"></div>'
        + '<div class="dropdown_element note_remove_all" lang-code="dropdown.removeall"></div>'
        + '</div>');
    $('body').append(dropDownCode);
    eLearnVideoJS.localizeChildren(dropDownCode);

    var dropDown = $('.user_note_dropdown.general');

    dropDown.find('.note_import').on('click', function() {
        eLearnVideoJS.importUserNotes(eLearnVideoJS.userNoteMenuNode.closest('.video-container'));
    });

    dropDown.find('.note_export').on('click', function() {
        eLearnVideoJS.exportUserNotes(eLearnVideoJS.userNoteMenuNode.closest('.video-container'), eLearnVideoJS.FILETYPE_JSON);
    });

    dropDown.find('.note_export_csv').on('click', function() {
        eLearnVideoJS.exportUserNotes(eLearnVideoJS.userNoteMenuNode.closest('.video-container'), eLearnVideoJS.FILETYPE_CSV);
    });

    dropDown.find('.note_remove_all').on('click', function() {
        if(confirm(eLearnVideoJS.getLocalizationFor("alert.removeall"))
            && eLearnVideoJS.userNoteMenuNode.is('.user_notes')) {
            eLearnVideoJS.userNoteMenuNode.find('.user_note').remove();
            eLearnVideoJS.updateUserNotes(eLearnVideoJS.userNoteMenuNode.closest('.video-container'));
            eLearnVideoJS.updateUserNotesArray(eLearnVideoJS.userNoteMenuNode.closest('.video-container'));
        }
    });
};

/**
* Creates the user note drop down menu for edit/delete...
* This element will be displayed and positioned on click of the menu button.
*/
eLearnVideoJS.createUserNoteMenu = function() {
    var dropDownCode = $('<div class="user_note_dropdown">'
        + '<div class="dropdown_element edit" lang-code="dropdown.edit"></div>'
        + '<div class="dropdown_element delete" lang-code="dropdown.remove"></div>'
        + '<div class="dropdown_element move_up" lang-code="dropdown.moveup"></div>'
        + '<div class="dropdown_element move_down" lang-code="dropdown.movedown"></div>'
        + '</div>');
    $('body').append(dropDownCode);
    eLearnVideoJS.localizeChildren(dropDownCode);

    var dropDown = $('.user_note_dropdown').not('.general');

    dropDown.find('.dropdown_element.edit').on('click', function(e) {
        eLearnVideoJS.userNoteMenuEdit();
    });
    dropDown.find('.dropdown_element.delete').on('click', function(e) {
        eLearnVideoJS.userNoteMenuDelete();
    });
    dropDown.find('.dropdown_element.move_up').on('click', function(e) {
        eLearnVideoJS.userNoteMenuMove(-1);
    });
    dropDown.find('.dropdown_element.move_down').on('click', function(e) {
        eLearnVideoJS.userNoteMenuMove(1);
    });
};

/**
* Hides the user note menu
*/
eLearnVideoJS.hideUserNoteMenu = function() {
    $('.user_note_dropdown').hide();
};

/**
* Toggles the user note menu note.
* @param element: the user note menu button dom element.
*/
eLearnVideoJS.toggleUserNoteMenu = function(element) {
    element = $(element);
    var dropDown = $('.user_note_dropdown');
    var node = element.closest('.user_note');

    if($('.user_note_dropdown').length == 0) {
        eLearnVideoJS.createUserNoteMenu();
        eLearnVideoJS.createGeneralUserNoteMenu();
    }

    if(element.is('.general_user_note_menu')) {
        dropDown = $('.user_note_dropdown.general');
        node = element.closest('.user_notes'); // node is the container
    }
    else {
        dropDown = $('.user_note_dropdown').not('.general');
    }

    // hide other either way
    $('.user_note_dropdown').not(dropDown).hide();

    var align = false;

    // last edited accessed again
    if(node.is(eLearnVideoJS.userNoteMenuNode)) {
        if(dropDown.is(':visible')) {
            dropDown.hide();
        }
        else if(!dropDown.is(':visible')) {
            dropDown.show();
            align = true;
        }
    }
    // other node, always show
    else {
        dropDown.show();
        align = true;
    }

    // set position
    if(align) {
        dropDown.css({
            top: (element.offset().top - dropDown.outerHeight(true) + 28) + "px",
            left: (element.offset().left - dropDown.outerWidth(true)) + "px"
        });
    }

    eLearnVideoJS.userNoteMenuNode = node;
};

/**
* Processes the click on the edit option of a user note.
*/
eLearnVideoJS.userNoteMenuEdit = function() {
    var backup_note = eLearnVideoJS.userNoteMenuNode.siblings('#' + eLearnVideoJS.userNoteMenuNode.attr("id") + ".backup");
    var videoContainer = backup_note.closest('.video-container');

    eLearnVideoJS.editNote(videoContainer, backup_note);
};

/**
* Processes the click on the delete option of a user note.
*/
eLearnVideoJS.userNoteMenuDelete = function() {
    var backup_note = eLearnVideoJS.userNoteMenuNode.siblings('#' + eLearnVideoJS.userNoteMenuNode.attr("id") + ".backup");
    var videoContainer = backup_note.closest('.video-container');

    if(confirm(eLearnVideoJS.getLocalizationFor("alert.remove"))) {
        eLearnVideoJS.deleteNote(videoContainer, backup_note);
    }
};

/**
* Processes the click on the move option of a user note.
* @param direction: -1: up, 1: down
*/
eLearnVideoJS.userNoteMenuMove = function(direction) {
    var backup_note = eLearnVideoJS.userNoteMenuNode.siblings('#' + eLearnVideoJS.userNoteMenuNode.attr("id") + ".backup");
    var videoContainer = backup_note.closest('.video-container');

    eLearnVideoJS.moveNote(videoContainer, eLearnVideoJS.userNoteMenuNode, backup_note, direction);
};

/**
* Generates a text file and offers it for eLearnVideoJS.download.
* @param filename: the filename
* @param text: the files text content
*/
eLearnVideoJS.download = function(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    //document.body.removeChild(element);
};

// ================================ HELP =====================================

/**
* Übersetzt einen String in einen Integerwert in Sekunden.
* Dabei können Strings erkannt werden die aus Zahlen bestehen und den
* zugehörigen Einheiten h,m,s.
* Außerdem können mit : getrennte Zeiten erkannt werden.
*
* Bsp: eLearnVideoJS.parseTimeString("01m15s") : 75
* Bsp: eLearnVideoJS.parseTimeString("01:15") : 75
*/
eLearnVideoJS.parseTimeString = function(str) {
    if(typeof str != typeof "string") return undefined;

    str = str.trim().toLowerCase();

    var seconds = undefined;

    // Style <HH>:<MM>:SS or S{n-times}
    if(str.match(/^(\d*:){0,2}\d+$/g)) {
        seconds = 0;
        str_parts = str.split(":");
        for(var i=0; i<str_parts.length && i<3; i++) {
            // from end to start
            var part = str_parts[str_parts.length - 1 - i];
            if(part.length > 0) {
                seconds += parseInt(part) * Math.pow(60, i);
            }
        }
    }
    // Style Xh Ym Zs
    else if(str.match(/^(\d+[hms]\s*)+$/g)){
        var factors = {
            "h":60*60,
            "m":60,
            "s":1
        };

        seconds = 0;
        var partTime = "";

        for(var i=0; i<str.length; i++) {
            var char = str.charAt(i);
            if(char.match(/\d/g)) {
                partTime += char;
            }
            else if(char.match(/[hms]/g)){
                seconds += parseInt(partTime, 10) * factors[char];
                partTime = "";
            }
            else if(char.match(/\S/g)){
                return undefined;
            }
        }
        if(partTime.length > 0) {
            seconds += parseInt(partTime, 10);
        }
    }


    return seconds;
};

/**
* Generates a letter style time string. E.g. "1m15s"
* @param seconds: integer value of seconds
*/
eLearnVideoJS.createTimeStringLetters = function(seconds) {
    var secLeft = seconds;

    var hours = parseInt(secLeft / 360);
    secLeft -= hours * 360;

    var minutes = parseInt(secLeft / 60);
    secLeft -= minutes * 60;

    return hours + "h" + minutes + "m" + seconds + "s";
};

/**
* Generates a colon style time string. E.g. "01:15"
* @param seconds: integer value of seconds
*/
eLearnVideoJS.createTimeStringColons = function(seconds) {
    seconds = Math.floor(Math.abs(seconds));
    var hours = Math.floor(seconds / (60*60));
    seconds -= hours*60*60;
    var minutes = Math.floor(seconds / 60);
    seconds -= minutes*60;

    var time_str = seconds;
    if(seconds < 10) {
        time_str = "0" + time_str;
    }
    time_str = minutes + ":" + time_str;
    if(hours > 0) {
        if(minutes < 10) {
                time_str = "0" + time_str;
        }
        time_str = hours + ":" + time_str;
    }

    if(time_str.toLowerCase().match(/nan/g)) {
        time_str = "";
    }

    return time_str;
};

eLearnVideoJS.initiateTabbedBox = function(box) {
    var div = box;

    div.wrap('<div class="tabbed-container"></div>');

    div.before('<div class="tabs"></div>');

    var tabs = div.parent().find('.tabs');

    div.find('.tab').each(function() {
        var tab = $(this);
        var tabSelect = $('<div class="tab-select">' + tab.attr('name') + '</div>');
        tabSelect.on('click', function(e) {
            eLearnVideoJS.selectTab(this);
        });
        tabs.append(tabSelect);
    });

    // set active tab to first
    div.find('.tab').hide();
    div.find('.tab').first().show();
    tabs.find('.tab-select').first().addClass('act');
};

/**
* Selects a tab of a tabbed box
* @param elemt, the tab element clicked on
* @event: Fires "ejstabchange"event on the .tabbed-container when done successfully.
*/
eLearnVideoJS.selectTab = function(element) {
    var e = $(element);
    var index = e.parent().children().index(e);
    var div = e.parent().nextAll('.tabbed-box').first();

    var tabbefore = div.find('.tab:visible').attr("name");

    // show only new
    div.find('.tab').hide();
    div.find('.tab').eq(index).show();
    e.parent().find('.tab-select').removeClass("act");
    e.addClass("act");

    var eventObj = {
        "tab": e.html(),
        "tabbefore" : tabbefore};
    eLearnVideoJS.fireEvent(div.closest('.tabbed-container')[0], eLearnVideoJS.createEvent("ejstabchange", eventObj));
};

eLearnVideoJS.touchSupported = false;
eLearnVideoJS.touchMouseChangeTimer = null;
eLearnVideoJS.lastTouch = undefined;

/**
* Simply returns the current eLearnVideoJS.touchSupported var value
* This value will not really return if touch is supported, but if it is
* actively used. So it returns if the last event was a touch event or a mouse
* was used. This way it can swap, based on the users preference.
*/
eLearnVideoJS.isTouchSupported = function() {
    return eLearnVideoJS.touchSupported;
};

/**
* Initiates the touch detection.
* This will set listeners to specific events which can detect
*/
eLearnVideoJS.initiateTouchDetection = function() {
    $(document).bind('touchstart', function(event) {
        eLearnVideoJS.lastTouch = new Date().getTime();
        clearTimeout(eLearnVideoJS.touchMouseChangeTimer);
        if(!eLearnVideoJS.touchSupported) {
            eLearnVideoJS.touchSupported = true;
            eLearnVideoJS.touchSupportedChanged();
        }
    });
    $(document).bind('mousemove', function(event) {
        // asynchronous for touch events fired afterwards
        eLearnVideoJS.touchMouseChangeTimer = setTimeout(function() {
            // more than 2s ago
            if(eLearnVideoJS.touchSupported && eLearnVideoJS.lastTouch < new Date().getTime() - 2000) {
                eLearnVideoJS.touchSupported = false;
                eLearnVideoJS.touchSupportedChanged();
            }
        }, 200);
    });
};

/**
* Will call all functions registered on eLearnVideoJS.touchSupportedChanged
* @event: Fires "ejsvideotouchmousechange" event on the window when done successfully.
*/
eLearnVideoJS.touchSupportedChanged = function() {
    eLearnVideoJS.fireEvent(window, eLearnVideoJS.createEvent("ejsvideotouchmousechange", {}));
};

eLearnVideoJS.createEvent = function(eventName, eventObj) {
    var event; // The custom event that will be created

    if (document.createEvent) {
      event = document.createEvent("HTMLEvents");
      event.initEvent(eventName, true, true);
    } else {
      event = document.createEventObject();
      event.eventType = eventName;
    }

    event.eventName = eventName;

    $.each(eventObj, function(k,v) {
        event[k] = v;
    });

    return event;
};

eLearnVideoJS.fireEvent = function(element, event) {
    if (document.createEvent) {
      element.dispatchEvent(event);
    } else {
      element.fireEvent("on" + event.eventType, event);
    }
};

eLearnVideoJS.isScrolledIntoView = function(elem) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return elemTop >= docViewTop && elemBottom <= docViewBottom;
}

// --------------------------------------------------------------------------------------
// JSON - CSV
// --------------------------------------------------------------------------------------

eLearnVideoJS.CSV_COLUMN_DELIMITER = ";";
eLearnVideoJS.CSV_ROW_DELIMITER = "\n";

/**
* Returns a CSV string parsed from the JSON data.
* JSONData can be a JSON string or object
* Will return false if the json data is invalid
*/
eLearnVideoJS.getCSVFromJSON = function(JSONData) {
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;


    var csv = '';

    //This will generate the Label/Header
    var row = "";

    //This loop will extract the label from 1st index of on array
    for (var index in arrData[0]) {
        //Now convert each value to string and comma-seprated
        row += '"' + index.replace(/"/g, '""') + '"' + eLearnVideoJS.CSV_COLUMN_DELIMITER;
    }
    //append Label row with line break
    csv += row + eLearnVideoJS.CSV_ROW_DELIMITER;

    //1st loop is to extract each row
    for (var i = 0; i < arrData.length; i++) {
        var row = "";

        //2nd loop will extract each column and convert it in string comma-seprated
        for (var index in arrData[i]) {
            row += '"' + arrData[i][index].replace(/"/g, '""') + '"' + eLearnVideoJS.CSV_COLUMN_DELIMITER;
        }
        //add a line break after each row
        csv += row + eLearnVideoJS.CSV_ROW_DELIMITER;
    }

    if (csv == '') {
        return false;
    }

    return csv;
};

eLearnVideoJS.getJSONFromCSV = function(CSVData) {
    var lines=CSVData.replace(/\r/g, "").split(eLearnVideoJS.CSV_ROW_DELIMITER);

    var result = [];

    // extract header values: take quote blocks with trailing DELIMITER
    var cells=lines[0].match(new RegExp('"(?:[^"]|(""))*"' + eLearnVideoJS.CSV_COLUMN_DELIMITER, "g"));
    var headers = [];
    // extract headers by removing trailing delimiter
    for(var i=0; i<cells.length; i++) {
        headers.push(
            cells[i]
                .replace(new RegExp(eLearnVideoJS.CSV_COLUMN_DELIMITER + "$", "g"), "")
                .replace(/^"/g, "")
                .replace(/"$/g, "")
                .replace(/""/g, '"'));
    }

    // go through lines below header
    for(var i=1;i<lines.length;i++) {
        var obj = {};
        var currentline=lines[i].match(new RegExp('"(?:[^"]|(""))*"' + eLearnVideoJS.CSV_COLUMN_DELIMITER, "g"));

        if(!currentline ||
            headers.length > currentline.length) break;

        // go through cells
        for(var j=0;j<headers.length;j++) {
            obj[headers[j]] = currentline[j]
                .replace(new RegExp(eLearnVideoJS.CSV_COLUMN_DELIMITER + "$", "g"), "")
                .replace(/^"/g, "")
                .replace(/"$/g, "")
                .replace(/""/g, '"');
        }

        result.push(obj);
    }

    return JSON.stringify(result); //JavaScript object
};
