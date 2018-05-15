/**
* Basic script containing only necessary elements
*/

const eLearnJS = eLearnJS || {};

$(document).ready(function() {
    eLearnJS.createContentOverview();
});

// -------------------------------------------------------------------------------------
// Overview
// -------------------------------------------------------------------------------------

// beinhaltet eine Liste alle bereits betrachteten Sections.
eLearnJS.sectionsVisited = [];

/**
* Erstellt ein Inhaltsverzeichnis. Wird #content-overview hinzugefügt.
*/
eLearnJS.createContentOverview = function() {
    if($('#content-overview').length > 0) {
        var text = "<ul>";
        var level = 0;
        var levels = {
            SUB : 1,
            SUBSUB : 2
        };

        for(var i=0; i<$('section').length; i++) {

            var sec = $($('section')[i]);

            if(sec.is('.hide-in-overview')) continue;

            var sec_level = 0;
            if(sec.is('.sub')) sec_level = levels.SUB;
            if(sec.is('.subsub')) sec_level = levels.SUBSUB;

            if($('#content-overview').is('.kachel')) {
                // es kann nur eine ebenen zur zeit geöffnet werden
                // aufgrund der Schachtelung in li's einzige logische Variante
                if(level < sec_level) {
                    // ende des li zum schachteln entfernen
                    text = text.substring(0, text.length - 5);
                    text += "<ul>\r\n";
                    level++;
                }
                // mehrere ebenen können gleichzeitig beendet werden
                while(level > sec_level) {
                    text += "</ul></li>\r\n";
                    level--;
                }
            }
            // listenansicht
            else {
                // higher level
                while(level < sec_level) {
                    text += "<ul>";
                    level++;
                }
                // lower level
                while(level > sec_level) {
                    text += "</ul>";
                    level--;
                }
            }

            text += "<li onclick='overviewShowSection("+i+"); event.stopPropagation();'>";

            text += "<div class='sectionRead'><div class='img'></div></div>";
            text += "<span class='title'>" + sec.attr('name') + "</span>";
            if(sec.attr('desc') != undefined
                && sec.attr('desc').length > 0) {
                text += "<p>" + sec.attr('desc') + "</p>";
            }

            text += "</li>";

            eLearnJS.sectionsVisited.push(false);
        }
        // close all open ul's
        while(level >= 0) {
            text+="</ul>";
            level--;
        }

        $('#content-overview').html(text);
        $('#content-overview').find('li').each(function(i,e) {
            if($(this).children('ul').length != 0) {
                $(this).addClass("wide");
            }
        });
        $('#content-overview').find("a").click(function(e) {
            e.preventDefault();
        });
    }
}

// dummy functions to catch undefined errors
eLearnJS.toggleAllSections = function() {};
eLearnJS.setNavigationTitle = function() {};
eLearnJS.setBackButtonEnabled = function() {};
eLearnJS.setBackButtonText = function() {};
eLearnJS.setBackPage = function() {};
eLearnJS.setLanguage = function() {};
eLearnJS.selectLanguage = function() {};

eLearnJS.generalDirectionButtonsEnabled = function() {};
eLearnJS.setKeyNavigationEnabled = function() {};
eLearnJS.generalProgressbarEnabled = function() {};
