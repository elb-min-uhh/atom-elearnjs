/*
* quiz.js v0.4.2 - 18/05/15
* JavaScript Quiz - by Arne Westphal
* eLearning Buero MIN-Fakultaet - Universitaet Hamburg
*/

var quizJS = quizJS || {};

// Quiztypen. Benennung entspricht dem, was im HTML Attribut qtype angegeben ist.
quizJS.quizTypes = {
    SHORT_TEXT : "short_text",
    CHOICE : "choice",
    FREE_TEXT : "free_text" ,
    FILL_BLANK : "fill_blank",
    FILL_BLANK_CHOICE : "fill_blank_choice",
    ERROR_TEXT : "error_text",
    HOTSPOT : "hotspot",
    CLASSIFICATION : "classification",
    ORDER : "order",
    MATRIX_CHOICE : "matrix_choice",
    PETRI : "petri",
    DRAW : "drawing"
};

quizJS.localization = {
    "de" : {
        "solve": "Lösen",
        "reset": "Zurücksetzen",
        "hide": "Ausblenden",
        "unanswered": "Du musst diese Frage zuerst beantworten, bevor du lösen kannst.",
        "already_answered": "Nicht änderbar, da die Frage bereits beantwortet wurde",
        "timeup": "Die Zeit ist abgelaufen. Die Frage wurde automatisch beantwortet und gesperrt.",
        "canvas.redo": "Wiederholen",
        "canvas.undo": "Rückgängig",
        "canvas.clear": "Löschen",
    },
    "en" : {
        "solve": "Solve",
        "reset": "Reset",
        "hide": "Hide",
        "unanswered": "You have to answer the question before you can solve.",
        "already_answered": "Cannot be changed because it was solved already.",
        "timeup": "The timer has expired. The question was solved and blocked automatically.",
        "canvas.redo": "Redo",
        "canvas.undo": "Undo",
        "canvas.clear": "Clear",
    },
};

quizJS.selectedLocale = quizJS.selectedLocale || "de";

quizJS.nextQuestionId = 0;
quizJS.start_time = {};
quizJS.passed_time = {};
quizJS.questionVisibility = {};

quizJS.timerAlertActive = false;
quizJS.timerAlertText = "";

/**
* Aktiviert alle <button> mit der Klasse "quizButton" für das Quiz.
* Wenn fragen <input> fokussiert ist, kann mit Enter die Antwort abgeschickt werden.
*/
$(document).ready(function() {
    quizJS.initiateQuiz();

    // fallback for browsers who do not support IntersectionObservers, only for elearn.js
    document.addEventListener("ejssectionchange", quizJS.updateQuestionVisibility);
});


// ------------------------------------------------------------
// INTERFACE
// ------------------------------------------------------------

/**
* Gibt zurück, ob alle sichtbaren Fragen beantwortet wurden. (bool)
*/
quizJS.getVisibleQuestionsAnswered = function() {
    return $('.question:visible').filter('.answered').length
            == $('.question:visible').length;
};


// ------------------------------------------------------------



/**
* Diese Funktion initialisiert das Quiz.
*/
quizJS.initiateQuiz = function() {
    quizJS.setLanguage(quizJS.selectedLocale);
    // Keine Tastaturnavigation
    keyAllowed = false;

    // Add qtypes if none defined
    $('div.question').each(function() {
        var div = $(this);
        if(div.attr('qtype') == undefined) {
            if(div.find('input[type="text"]').length > 0) {
                div.attr('qtype', quizJS.quizTypes.SHORT_TEXT);
            }
            else if(div.find('input[type="checkbox"]').length > 0
                    || div.find('input[type="radio"]').length > 0) {
                div.attr('qtype', quizJS.quizTypes.CHOICE);
            }
        }

        var lang;
        if(div.attr('lang') && quizJS.localization[div.attr('lang').toLowerCase()]) lang = div.attr('lang').toLowerCase();

        // Buttons hinzufügen
        var solve = $('<button lang-code="solve" class="quizButton solve"></button>');
        if(lang) solve.attr('lang', lang);
        div.after(solve);
        quizJS.localizeElement(solve);

        solve.click(function(e) { quizJS.submitAns(div);});

        var reset = $('<button lang-code="reset" class="quizButton reset"></button>');
        if(lang) reset.attr('lang', lang);
        solve.after(reset);
        quizJS.localizeElement(reset);

        reset.click(function(e) { quizJS.submitAns(div);});

        // Add No Selection Feedback
        var unanswered = $('<div lang-code="unanswered" class="feedback noselection"></div>');
        div.append(unanswered);
        quizJS.localizeElement(unanswered);
    });

    // Hide Feedbacks
    $("div.question").children("div.feedback").hide();

    // Hide reset-Buttons
    $("button.reset").hide();

    quizJS.windowResizing();
    $(window).resize(function() {quizJS.windowResizing()});

    quizJS.shuffleAnswers();
    quizJS.replaceRandoms();

    // Submit with enter for every question possible
    $(".answers label").keyup(function(event) {
        if(event.which == 13) {
            var div = $(this).closest("div.question");
            if(!div.is('[qtype="'+quizJS.quizTypes.FREE_TEXT+'"]')) {
                div.next(':button').click();
            }
        }
    });


    // Fehlertext Buttons toggle
    $(".error_button").click(function() { quizJS.toggleErrorButton(this); });

    $("#neustart").click(function() {
        quizJS.resetQuiz();
    });

    quizJS.addDragAndDropToClassification();
    quizJS.addDragAndDropToOrderObjects();

    quizJS.resetQuiz();

    quizJS.initiateChoice();
    quizJS.initiateFreeText();
    quizJS.initiateErrorText();
    quizJS.initiateMatrix();
    quizJS.initiateHotspotImage();
    quizJS.initiatePetriImage();
    quizJS.initiateDrawingCanvas();

    quizJS.initListeners();
    quizJS.initTimers();
};

quizJS.initListeners = function() {
    $('div.question').each(function(i, e) {
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
                    quizJS.resizeQuestion($(entry.target));
                }
            }, options);

            observer.observe(el.get(0));
        } catch(e) {
            // ignore;
        }
        // resizesensor as visibility listener this will only work with Chrome engine browsers
        try {
            new ResizeSensor(el, function(dim) {
                quizJS.resizeQuestion(el);
            });
        } catch(e) {
            // ignore;
        }
    });
};

/**
* Sets the language for all elements.
*/
quizJS.setLanguage = function(langCode) {
    langCode = langCode.toLowerCase();
    if(quizJS.localization[langCode] !== undefined) {
        quizJS.selectedLocale = langCode;
        $('[lang-code],[lang-code-title]').each(function(i,e) {
            quizJS.localizeElement($(e));
        });
        quizJS.windowResizing();
    }
    else {
        throw "Unsupported language selected. Supported language codes are: "  + Object.keys(quizJS.localization).toString();
    }
}
quizJS.selectLanguage = quizJS.setLanguage;

/**
* Localizes one specific element to match the selected language.
* The selected language is the quizJS.selectedLocale if not specific
* `lang` attribute is present in the HTML element
*/
quizJS.localizeElement = function(el, force) {
    if($(el).attr('localized') === "false" && !force) return;

    var loc = quizJS.selectedLocale;
    if(el.closest('[lang]').length) {
        var lang = el.closest('[lang]').attr('lang').toLowerCase();
        if(quizJS.localization[lang]) loc = lang;
    }

    if(el.attr("lang-code")) {
        var text = quizJS.localization[loc][el.attr("lang-code")];
        if(text) {
            if($(el).attr('localized') === "html") el.html(text);
            else el.text(text);
        }
    }

    if(el.attr("lang-code-title")) {
        var text = quizJS.localization[loc][el.attr("lang-code-title")];
        if(text) {
            el.attr('title', text);
        }
    }
}

/**
* Wird beim Bestätigen einer Antwort aufgeruffen.
* @param button - ist der geklickte Button von dem aus die beantwortete Frage
*                 bestimmt wird.
*/
quizJS.submitAns = function(div, force) {
    // Falls die Frage bereits beantwortet wurde, wird sie zurückgesetzt. (2. Button)
    if(div.is('.answered')) {
        quizJS.resetQuestion(div);
        return;
    }

    var c = quizJS.elementsToTextArray(div.find("a.ans"));

    var labels = div.find('.answers').find('label');
    quizJS.deleteLabelColoring(labels);

    var type = div.attr("qtype");

    var correct = true;

    // Für alte Versionen oder nichtdefinierte Fragetypen
    if(type === undefined) {
        type = labels.find('input').attr("type");

        if(type === "text") {
            correct = quizJS.getCorrectForText(labels, c);
        }
        else if (type === "radio" || type === "checkbox") {
            correct = quizJS.getCorrectForRadio(labels, c, true);
        }
    }
    // Für explizit definierten qtype
    else {
        if(type === quizJS.quizTypes.SHORT_TEXT) {
            correct = quizJS.getCorrectForText(labels, c, force);
        }
        else if(type === quizJS.quizTypes.CHOICE) {
            correct = quizJS.getCorrectForRadio(labels, c, true, force);
        }
        else if(type === quizJS.quizTypes.FREE_TEXT) {
            quizJS.processFreeText(div);
        }
        else if(type === quizJS.quizTypes.FILL_BLANK) {
            var answers = div.find("a.ans");
            correct = quizJS.getCorrectFillBlank(labels, answers, force);
        }
        else if(type === quizJS.quizTypes.FILL_BLANK_CHOICE) {
            var answers = div.find("a.ans");
            correct = quizJS.getCorrectFillBlankChoice(labels, answers, force);
        }
        else if(type === quizJS.quizTypes.ERROR_TEXT) {
            var buttons = div.find(".error_button");
            correct = quizJS.getCorrectErrorText(buttons, c, force);
        }
        else if(type === quizJS.quizTypes.CLASSIFICATION) {
            var dests = div.find(".destination");
            var answers = div.find("a.ans");
            correct = quizJS.getCorrectClassification(dests, answers, force);
            if(correct !== -1) {
                div.find('.object').addClass("blocked");
            }
        }
        else if(type === quizJS.quizTypes.ORDER) {
            var objects = div.find(".object").not(".destination");
            var answers = div.find("a.ans");
            correct = quizJS.getCorrectOrder(objects, answers, force);
            div.find('.object').addClass("blocked");
        }
        else if(type === quizJS.quizTypes.MATRIX_CHOICE) {
            var rows = div.find("tr");
            var answers = div.find("a.ans");
            correct = quizJS.getCorrectMatrixChoice(rows, answers, force);
        }
        else if(type === quizJS.quizTypes.HOTSPOT) {
            var hss = div.find('.hotspot');
            var task = div.find('.gesucht,.task').html();
            var answer = div.find('a.ans').filter('[id="'+task+'"]');
            correct = quizJS.getCorrectHotspot(div, hss, answer, force);
            hss.filter('.act').removeClass('act');
            if(correct !== -1 && correct !== true && correct !== 2) return;
        }
        else if(type === quizJS.quizTypes.PETRI) {
            correct = quizJS.processPetri(div, force);
            if(div.is(".unbewertet") || div.is(".unranked")) {
                quizJS.deleteLabelColoring(div);
                div.find('.feedback').hide();
            }
            if(!correct) {
                // unbewertete Frage - Kein labelColoring
                return;
            }
        }
        else if(type === quizJS.quizTypes.DRAW) {
            quizJS.processDrawing(div);
        }
    }

    if(correct == -1 && force === true) {
        correct = false;
    }

    if(correct === -1) {
        quizJS.deleteLabelColoring(labels);
        div.children("div.feedback").filter(".correct").hide();
        div.children("div.feedback").filter(".incorrect").hide();
        div.children("div.feedback").filter(".information").hide();
        div.children("div.feedback").filter(".noselection").show();
        return;
    }
    else if(div.is(".unbewertet") || div.is(".unranked")) {
        quizJS.deleteLabelColoring(div);
        div.children("div.feedback").filter(".noselection").hide();
        div.children("div.feedback").filter(".correct").hide();
        div.children("div.feedback").filter(".incorrect").hide();
        div.children("div.feedback").filter(".information").show();
    }
    else if(correct === true) {
        div.children("div.feedback").filter(".noselection").hide();
        div.children("div.feedback").filter(".incorrect").hide();
        div.children("div.feedback").filter(".information").hide();
        div.children("div.feedback").filter(".correct").show();
    }
    else if(correct === false) {
        div.children("div.feedback").filter(".noselection").hide();
        div.children("div.feedback").filter(".correct").hide();
        div.children("div.feedback").filter(".information").hide();
        div.children("div.feedback").filter(".incorrect").show();
    }
    // hide all (hotspot, petri when finished)
    else if(correct === 2) {
        div.children("div.feedback").filter(".noselection").hide();
        div.children("div.feedback").filter(".correct").hide();
        div.children("div.feedback").filter(".incorrect").hide();
        div.children("div.feedback").filter(".information").show();
    }

    quizJS.blockQuestion(div);

    div.addClass("answered");
    div.next("button.quizButton.solve").hide();

    if(!div.is('.reset_blocked')) div.nextUntil("div").filter("button.quizButton.reset").show();
};



/**
* Liest für ein <div> alle als korrekt angegebenen Antworten aus.
* Diese sollten MD5 Verschlüsselt sein.
*/
quizJS.elementsToTextArray = function(ans) {
    var c = [];
    ans.each(function(i) {
        c[c.length] = $(this).html();
    });
    return c;
};


/**
* Gibt zurück, ob die Frage richtig beantwortet wurde bei einer Radio-Type-Frage.
* -1 Falls keine Antwort ausgewählt.
* @param labels      - alle labels die in der Frage vorkommen
* @param c           - alle korrekten Antworten. Ein Array, dass die aus <a class="ans></a> jeweiligen MD5 Verschlüsselten Antworten beinhaltet.
* @param colorLabels - true, Labels automatisch je nach korrektheit gefärbt werden sollen.
*                            Es werden alle Antworten die richtigen Antworten auf die Frage grün gefärbt.
*                            Fälschlicherweise angekreute Antworten werden rot markiert. Falsche und nicht angekreuzte Antworten bleiben weiß.
*/
quizJS.getCorrectForRadio = function(labels, c, colorLabels, force) {
    var correct = true;
    var numberofchecked = 0;
    labels.each(function(i) {
        var input = $(this).find('input');
        var correctAnswer = quizJS.contains(c, quizJS.encryptMD5(input.val()));

        if(input.is(':checked')) {
            numberofchecked++;
        }

        // wrong answer
        if(correctAnswer != input.is(':checked')) {
            correct = false;
        }
        // correct answer
        else {

        }

        // should be checked
        if(correctAnswer){
            $(this).addClass("right_icon");

            if(input.is(':checked')) $(this).addClass("right");
            else $(this).addClass("wrong");
        }
        // should not be checked
        else {
            $(this).addClass("wrong_icon");

            if(input.is(':checked')) $(this).addClass("wrong");
            else $(this).addClass("right");
        }
    });
    if(numberofchecked === 0 && !force) {
        correct = -1;
    }
    return correct;
};


/**
* Gibt zurück, ob die eingegebene Antwort zu den korrekten gehört.
* -1 falls Textfeld leer.
*/
quizJS.getCorrectForText = function(labels, c, force) {
    var correct = true;
    var ans = labels.children('input').val().trim();
    ans = quizJS.encryptMD5(ans);
    if(!quizJS.contains(c, ans)) {
        correct = false;
    }
    if(labels.children('input').val().length == 0 && !force) {
        correct = -1;
    }

    if(correct) {
        labels.addClass("right");
        labels.addClass("right_icon");
    }
    else {
        labels.addClass("wrong");
        labels.addClass("wrong_icon");
    }
    return correct;
};

/**
* Lücken Text mit Textfeldern
*
* -1 falls nicht alle ausgefüllt
*/
quizJS.getCorrectFillBlank = function(labels, answers, force) {
    var correct = true;

    labels.each(function(i, e) {
        var input = $(this).find("input");
        var id = input.attr("id");

        // alle richtigen antworten zu der ID
        var cor = quizJS.elementsToTextArray(answers.filter("#"+id));
        var ans = quizJS.encryptMD5(input.val().trim());

        // nicht ausgefüllt
        if(input.val().length == 0 && !force) {
            correct = -1;
            quizJS.deleteLabelColoring($(this).closest('.question'));
            return false;
        }

        // antwort richtig
        if(quizJS.contains(cor, ans) || cor.length == 0) {
            $(this).addClass("right");
            $(this).addClass("right_icon");
        }
        // antwort falsch
        else if(!quizJS.contains(cor, ans)) {
            correct = false;
            $(this).addClass("wrong");
            $(this).addClass("wrong_icon");
        }
    });

    return correct;
};


/**
* Lücken Text mit Select
*
* kann nicht unbeantwortet sein
*/
quizJS.getCorrectFillBlankChoice = function(labels, answers, force) {
    var correct = true;

    labels.each(function(i, e) {
        var select = $(this).find("select");
        var id = select.attr("id");

        // alle richtigen antworten zu der ID
        var cor = quizJS.elementsToTextArray(answers.filter("#"+id));
        var ans = quizJS.encryptMD5(select.val());

        // antwort richtig
        if(quizJS.contains(cor, ans) || cor.length == 0) {
            $(this).addClass("right");
            $(this).addClass("right_icon");
        }
        // antwort falsch
        else if(!quizJS.contains(cor, ans)) {
            correct = false;
            $(this).addClass("wrong");
            $(this).addClass("wrong_icon");
        }
    });

    return correct;
};


/**
* Fehlertext. markierbare Wörter
*
* Kann nicht unausgefüllt sein
*/
quizJS.getCorrectErrorText = function(buttons, c, force) {
    var correct = true;

    buttons.each(function(i, e) {
        var ans = quizJS.encryptMD5($(this).text());

        var act = $(this).is(".act");

        // Wort markiert und in Antworten enthalten
        if((quizJS.contains(c, ans) && act)
            || (!quizJS.contains(c, ans) && !act)) {
            // richtig
            $(this).closest('label').addClass("right");
            $(this).closest('label').addClass("right_icon");
        }
        // Nicht markiert oder nicht in Antworten
        else if(!quizJS.contains(c, ans) ^ !act) {
            // falsch
            correct = false;
            $(this).closest('label').addClass("wrong");
            $(this).closest('label').addClass("wrong_icon");
        }
    });

    return correct;
};


/**
* Zuordnung
*
* -1 falls eines der Ziele nicht gefüllt
*/
quizJS.getCorrectClassification = function(dests, answers, force) {
    var correct = true;

    // nicht min. 1 platziert
    if(dests.filter('.full').length == 0 && answers.length != 0 && !force) {
        correct = -1;
        quizJS.deleteLabelColoring($(this).closest('.question'));
        return correct;
    }

    dests.each(function(i, e) {
        var dest = $(this);
        var id = dest.attr("id");

        // alle richtigen antworten zu der ID
        var cor = quizJS.elementsToTextArray(answers.filter("#"+id));

        var ans = quizJS.encryptMD5(dest.children().attr("id"));

        // antwort richtig
        if(quizJS.contains(cor, ans) || cor.length == 0) {
            $(this).addClass("right");
            $(this).addClass("right_icon");
        }
        // antwort falsch
        else if(!quizJS.contains(cor, ans)) {
            correct = false;
            $(this).addClass("wrong");
            $(this).addClass("wrong_icon");
        }
    });

    return correct;
};


/**
* Reihenfolge
*
* Kann nicht unausgefüllt sein
*/
quizJS.getCorrectOrder = function(objects, answers, force) {
    var correct = true;
    var index = 0;

    objects.each(function(i, e) {
        var obj = $(this);
        var id = obj.children().attr("id");
        var cor = answers.filter("#"+id).text();

        // check if found object is in correct position
        // correct position is same or next active index

        // same position
        if(quizJS.encryptMD5(""+index) == cor) {
            $(this).addClass("right");
            $(this).addClass("right_icon");
        }
        // antwort richtig
        else if(quizJS.encryptMD5(""+(index+1)) == cor) {
            index++;
            $(this).addClass("right");
            $(this).addClass("right_icon");
        }
        // antwort falsch
        else {
            correct = false;
            $(this).addClass("wrong");
            $(this).addClass("wrong_icon");
        }
    });

    return correct;
};

/**
* Matrix (single/multiple) choice
*
* -1 wenn nicht in jeder Zeile mindest eines ausgewählt
*/
quizJS.getCorrectMatrixChoice = function(rows, answers, force) {
    var correct = true;

    rows.each(function(i, e) {
        var row = $(this);
        var id = row.attr("id");
        var cor = quizJS.elementsToTextArray(answers.filter("#"+id)); // Mehrere Antworten können vorhanden sein

        var inputs = row.find("input"); // alle Inputs der Zeile

        // keines ausgewählt in einer Zeile
        if(inputs.length > 0 && inputs.filter(':checked').length == 0
            && !force) {
            correct = -1;
            quizJS.deleteLabelColoring($(this).closest('.question'));
            return false;
        }

        inputs.each(function(ii, ee) {
            var ans = $(rows.find(".antwort,.answer").get(ii)).attr("id");
            ans = quizJS.encryptMD5(ans);

            // ausgewählt und richtig oder nicht ausgewählt und nicht richtig (insg richtig)
            if(($(ee).is(":checked") && quizJS.contains(cor, ans))
                || (!$(ee).is(":checked") && !quizJS.contains(cor, ans))) {
            }
            // falsch
            else {
                correct = false;
            }

            // should be checked
            if(quizJS.contains(cor, ans)) {
                $(this).closest('label').addClass("right_icon");

                if($(ee).is(":checked")) $(this).closest('label').addClass("right");
                else $(this).closest('label').addClass("wrong");
            }
            // should not be checked
            else {
                $(this).closest('label').addClass("wrong_icon");

                if($(ee).is(":checked")) $(this).closest('label').addClass("wrong");
                else $(this).closest('label').addClass("right");
            }
        });
    });

    return correct;
};


quizJS.getCorrectHotspot = function(div, hss, answer, force) {
    var finished = false;

    // nichts ausgewählt
    if(hss.filter('.act').length == 0 && !force) {
        return -1;
    }
    else {
        var ans = hss.filter('.act').attr('id');
        ans = quizJS.encryptMD5(ans);

        var correct = ans == answer.html();
        var cl = "cor";
        if(!correct) cl = "inc";

        hss.filter('.act').find('.descr').append("<div class='"+cl+"'>"
                                                    + div.find('.gesucht,.task').html()
                                                    + "</div>");

        if(!div.is('.unbewertet') && !div.is(".unranked")) {
            if(correct) {
                div.children("div.feedback").filter(".noselection").hide();
                div.children("div.feedback").filter(".incorrect").hide();
                div.children("div.feedback").filter(".correct").show();
            }
            else {
                div.children("div.feedback").filter(".noselection").hide();
                div.children("div.feedback").filter(".correct").hide();
                div.children("div.feedback").filter(".incorrect").show();
            }
        }


        finished = !quizJS.hotspotNextObject(div);

        if(finished) {
            quizJS.findCorrectsHotspot(div);
            // for information show
            finished = 2;
        }
    }
    return finished;
};


quizJS.getCorrectPetri = function(div, places, answers, force) {

    // nichts ausgewählt
    if(places.filter('.act').length == 0 && !force) {
        return -1;
    }
    else {
        correct = true;
        var ans_id = div.find('.petri_image').find('img:visible').attr('id');
        var c = quizJS.elementsToTextArray(answers.filter('#'+ans_id));

        places.each(function(i,e) {
            var ans = $(this).attr('id');
            ans = quizJS.encryptMD5(ans);

            // markiert und richtig
            if(($(this).is(".act") && quizJS.contains(c, ans))
                || (!$(this).is(".act") && !quizJS.contains(c, ans))) {
                $(this).addClass("right");
                $(this).addClass("right_icon");
            }
            else {
                correct = false;
                $(this).addClass("wrong");
                $(this).addClass("wrong_icon");
            }
        });

        if(correct) {
            div.children("div.feedback").filter(".noselection").hide();
            div.children("div.feedback").filter(".incorrect").hide();
            div.children("div.feedback").filter(".correct").show();
        }
        else {
            div.children("div.feedback").filter(".noselection").hide();
            div.children("div.feedback").filter(".correct").hide();
            div.children("div.feedback").filter(".incorrect").show();
        }

        div.addClass("show_feedback");
    }
    return false;
};

// --------------------------------------------------------------------------------------
// PROCESS ANSWER
// --------------------------------------------------------------------------------------


quizJS.processFreeText = function(div) {
    // do nothing
};

/**
* Verarbeiten des "Lösen" Knopfes in einer Petri-Netz Aufgabe
*/
quizJS.processPetri = function(div, force) {
    var places = div.find('.place');

    var correct = 0;

    // after answer
    if(div.is('.show_feedback')) {
        div.removeClass("show_feedback");
        quizJS.petriNextPart(div);
        if(quizJS.petriFinished(div)) {
            // for information show
            correct = 2;
        }
        else {
            quizJS.deleteLabelColoring(places);
            places.filter('.act').removeClass('act');
            correct = false;
        }
    }
    // before answer - when answering
    else {
        var answers = div.find('a.ans');
        correct = quizJS.getCorrectPetri(div, places, answers, force);
        if(correct != -1) {
            quizJS.petriShowCorrectBG(div);
            correct = false;
        }
    }

    return correct;
};

quizJS.processDrawing = function(div) {
    div.find('.drawing_canvas_container').addClass("blocked");
};

// --------------------------------------------------------------------------------------

quizJS.finishQuestion = function(div) {
    var try_count = 50;
    while(!div.is(".answered") && try_count > 0) {
        quizJS.submitAns(div, true);
        try_count -= 1;
    }
};



// --------------------------------------------------------------------------------------
// CHOICE
// --------------------------------------------------------------------------------------

// changes type to multiple/single if .answers has class .multiple or .single
quizJS.initiateChoice = function() {
    var root = $('[qtype="'+quizJS.quizTypes.CHOICE+'"]');

    root.each(function(i,e) {
        var div = $(this);

        var ans = div.find('.answers');

        if(ans.is('.multiple')) {
            ans.find('input').attr("type", "checkbox");
        }
        else if(ans.is('.single')) {
            ans.find('input').attr("type", "radio");
        }

        ans.find('input').attr("name", "choice_" + i);

        ans.find('input').each(function(ii,ee) {
            var input = $(ee);
            if(input.attr('val') != undefined) {
                input.val(input.attr('val'));
                input.attr('val', "");
            }
        });
    });
};


// --------------------------------------------------------------------------------------
// FREE TEXT
// --------------------------------------------------------------------------------------

quizJS.initiateFreeText = function() {
    var root = $('[qtype="'+quizJS.quizTypes.FREE_TEXT+'"]');

    root.addClass("unranked");
};


// --------------------------------------------------------------------------------------
// ERROR TEXT (Buttons)
// --------------------------------------------------------------------------------------

quizJS.initiateErrorText = function() {
    var root = $('[qtype="'+quizJS.quizTypes.ERROR_TEXT+'"]');

    root.find('.error_button').wrap("<label></label>");
};

// --------------------------------------------------------------------------------------
// MATRIX
// --------------------------------------------------------------------------------------

quizJS.initiateMatrix = function() {
    var root = $('[qtype="'+quizJS.quizTypes.MATRIX_CHOICE+'"]');

    root.find('input').wrap("<label></label>");

    // for each question
    root.each(function(i,e) {
        var div = $(this);

        var ans = div.find('.answers');

        var type = "checkbox";
        if(ans.is(".single") || ans.find('input[type="radio"]').length > 0) {
            type = "radio";
        }

        // check row and fill with TD
        var rows = ans.find('tr');
        rows.each(function(ii,ee) {
            if(ii === 0) return true;

            var row = $(ee);

            // append td's
            while((row.find('td').length + row.find('th').length)
                < (rows.first().find('td').length + rows.first().find('th').length)) {
                row.append('<td><label><input/></label></td>');
            }

            // set name for each row
            row.find('input').attr("name", "choice_" + i + "_row_" + ii);
        });

        // set type
        ans.find('input').attr("type", type);
    });
};

// --------------------------------------------------------------------------------------
// DRAG AND DROP FUNCTIONS
// --------------------------------------------------------------------------------------




quizJS.draggedObjects = null;
quizJS.startedObject = null;

// CLASSIFICATION

/**
* Jedes Object kann gedragt und gedropt werden in jedem Object.
*/
quizJS.addDragAndDropToClassification = function() {
    var root = $('[qtype="'+quizJS.quizTypes.CLASSIFICATION+'"]');
    root.find('.object').attr("draggable", "true");
    root.find('.object').on("dragstart", function(event) {
        quizJS.dragObject(event.originalEvent);
    });
    root.find('.object').on("dragover", function(event) {
        quizJS.allowObjectDrop(event.originalEvent);
    });
    root.find('.object').on("drop", function(event) {
        quizJS.dropObject(event.originalEvent);
    });

    root.find('.object').on("dragend", function(event) {
        quizJS.dragReset(event.originalEvent);
    });

    root.find('.object').on("dragenter", function(event) {
        quizJS.draggedOver(event.originalEvent);
    });
    root.find('.object').on("dragleave", function(event) {
        quizJS.draggedOut(event.originalEvent);
    });

    // mobile unterstützung / Klick-Fallback. Auch am Desktop möglich
    root.find('.object').on("click", function(event) {
        if(quizJS.startedObject == null) {
            quizJS.dragObject(event.originalEvent);
        }
        else {
            quizJS.dropObject(event.originalEvent);
            quizJS.dragReset(event.originalEvent);
        }
    });

};


// ORDER

quizJS.addDragAndDropToOrderObjects = function() {
    var root = $('[qtype="'+quizJS.quizTypes.ORDER+'"]');
    root.find('.object').attr("draggable", "true");
    root.find('.object').on("dragstart", function(event) {
        quizJS.dragObject(event.originalEvent);
    });

    root.find('.object').on("dragend", function(event) {
        quizJS.dragReset(event.originalEvent);
    });


    // mobile unterstützung / Klick-Fallback. Auch am Desktop möglich
    root.find('.object').on("click", function(event) {
        if(quizJS.startedObject == null) {
            quizJS.dragObject(event.originalEvent);
        }
        else {
            quizJS.dragReset(event.originalEvent);
        }
    });

    quizJS.addDragAndDropToOrderDestinations(root);
};

quizJS.addDragAndDropToOrderDestinations = function(root) {
    root.find('.object').after(
        "<div class='object destination'></div>");
    root.find('.object').first().before(
        "<div class='object destination'></div>");

    root.find('.destination').on("dragover", function(event) {
        quizJS.allowObjectDrop(event.originalEvent);
    });
    root.find('.destination').on("drop", function(event) {
        quizJS.dropObject(event.originalEvent);
    });

    root.find('.destination').on("dragend", function(event) {
        quizJS.dragReset(event.originalEvent);
    });

    root.find('.destination').on("dragenter", function(event) {
        quizJS.draggedOver(event.originalEvent);
    });
    root.find('.destination').on("dragleave", function(event) {
        quizJS.draggedOut(event.originalEvent);
    });

    // mobile unterstützung / Klick-Fallback. Auch am Desktop möglich
    root.find('.destination').on("click", function(event) {
        if(quizJS.startedObject == null) {
        }
        else {
            quizJS.dropObject(event.originalEvent);
            quizJS.dragReset(event.originalEvent);
        }
    });
};


// DRAG & DROP --------------------------


/**
* Fügt dem Datentransfer alle zu verschiebenen Objekte hinzu
*/
quizJS.dragObject = function(e) {
    // get type
    var type = $(e.target).closest(".question").attr("qtype");

    var target = $(e.target).closest('.object')[0];

    // für firefox notwendig, sonst startet drag nicht
    // try da Microsoft edge sonst abbricht
    try {
        if(e.type === "dragstart") e.dataTransfer.setData("transer", "data");
    }
    catch(e) {
        // do nothing
    }

    if(type === quizJS.quizTypes.CLASSIFICATION) {
        // Falls noch nicht benutzt
        if(!$(target).is(".used") && !$(target).is(".blocked")) {
            quizJS.draggedObjects = $(target).children();
            quizJS.startedObject = $(target);
            $(target).css("opacity", "0.4");
            $(target).css("background", "#888");
            $(target).closest(".answers").find(".destination").not(".full").addClass("emph");

            $(target).closest(".question").find(".object.used").each(function(i,e) {
                if($(this).children().attr("id") == quizJS.draggedObjects.attr("id")) {
                    $(this).addClass("emph");
                }
            });
        }
        else {
            e.preventDefault();
        }
    }
    else if(type === quizJS.quizTypes.ORDER) {
        if(!$(target).is(".blocked")) {
            quizJS.startedObject = $(target);
            $(target).css("opacity", "0.4");
            $(target).css("background", "#888");
            setTimeout(function() {
                $(target).closest(".answers").find(".destination").addClass("vis");
                $(target).prev().removeClass("vis");
                $(target).next().removeClass("vis");

                // change height of destinations
                $(target).closest('.answers').find('.object.destination').css({
                    "min-height" : $(target).closest('.answers').find('.object').not('.destination').first().height() + "px",
                    "min-width": "5px"
                });
            }, 0);
        }
        else {
            e.preventDefault();
        }
    }

};


/**
* Verhindert Standardfunktionen
*/
quizJS.allowObjectDrop = function(e) {
    e.preventDefault();
};

/**
* Verschiebt alle Objekte in das Ziel
*/
quizJS.dropObject = function(e) {
    // get type
    var type = $(e.target).closest(".question").attr("qtype");

    var target = $(e.target).closest('.object')[0];

    if(type === quizJS.quizTypes.CLASSIFICATION) {
        var dragBackToStart = quizJS.draggedObjects.attr('id') == $(target).children().attr('id');

        // Ablegen an freiem Platz aus StartObjekt (!= Zielobjekt)
        if(!quizJS.startedObject.is(".destination")
                && $(target).is(".object.destination")
                && $(target).is(".object")
                && !$(target).is(".full")
                && !$(target).is(".blocked")) {
            e.preventDefault();
            quizJS.startedObject.addClass("used");
            $(target).append(quizJS.draggedObjects.clone());
            $(target).addClass("full");
            quizJS.dragReset();
        }
        // Ablegen an freiem Platz aus Zielobjekt (verschieben)
        else if(quizJS.startedObject.is(".destination")
                && $(target).is(".object.destination")
                && !$(target).is(".full")
                && !dragBackToStart
                && !$(target).is(".blocked")) {
            quizJS.startedObject.removeClass("full");
            $(target).append(quizJS.draggedObjects);
            $(target).addClass("full");
            quizJS.dragReset();
        }
        // Zurücklegen an ursprünglichen Ort
        else if($(target).is(".object") && $(target).is(".used")
            && dragBackToStart
            && !$(target).is(".blocked")) {
            quizJS.startedObject.removeClass("full");
            quizJS.draggedObjects.remove();
            $(target).removeClass("used");
            quizJS.dragReset();
        }
    }
    else if(type === quizJS.quizTypes.ORDER) {
        $(target).after(quizJS.startedObject);

        var root = $(target).closest(".question");
        root.find(".destination").remove();

        quizJS.addDragAndDropToOrderDestinations(root);
        quizJS.dragReset();
    }
};

/**
* Setzt Sachen zurück die während des Dragvorgangs verwendet werden.
*/
quizJS.dragReset = function(e) {
    // remove emphasis
    if(e != undefined) $(e.target).closest(".answers").find(".emph").removeClass("emph");

    $('.draggedover').removeClass("draggedover");
    $(".object").css("opacity", "");
    $(".object").css("background", "");
    $('.question[qtype="'+quizJS.quizTypes.ORDER+'"]').find(".destination").removeClass("vis");
    quizJS.draggedObjects = null;
    quizJS.startedObject = null;
};

quizJS.draggedOver = function(e) {
    var target = $(e.target).closest('.object')[0];
    // Leer oder zurücklegen zur Ursprungsort
    if(!$(target).is(".full")
        || quizJS.draggedObjects == $(target).children()) $(target).addClass("draggedover");
};

quizJS.draggedOut = function(e) {
    var target = $(e.target).closest('.object')[0];
    // Leer oder zurücklegen zur Ursprungsort
    if(!$(target).is(".full")
        || quizJS.draggedObjects == $(target).children()) $(target).removeClass("draggedover");
};




// --------------------------------------------------------------------------------------
// HOTSPOT
// --------------------------------------------------------------------------------------

quizJS.activeElement = 0;

quizJS.initiateHotspotImage = function() {
    var root = $('[qtype="'+quizJS.quizTypes.HOTSPOT+'"]');

    // Descr (richtige und falsche antworten) hinzufügen
    root.find('.hotspot').append('<div class="descr"></div>')

    // hover funktionen
    root.find('.hotspot').mouseover(function(event) {
        if($(this).find('.descr').children().length > 0) $(this).find('.descr').show();
        quizJS.calculateHotspotDescriptions($(this).closest('[qtype="'+quizJS.quizTypes.HOTSPOT+'"]'));
    });
    root.find('.hotspot').mouseout(function(event) {
        $(this).find('.descr').hide();
    });


    // Klicken auf Hotspot
    root.find('.hotspot').click(function() {
        quizJS.hotspotClick($(this));
    });


    // zeigt erstes gesuchtes objekt in .gesucht an
    root.each(function(i,e) {
        quizJS.hotspotNextObject($(e));
    });

    // berechnet Größe der Hotspots
    quizJS.calculateHotspotDimensions();
};


quizJS.hotspotClick = function(hs) {
    if(!hs.is('.blocked')) {
        hs.closest('[qtype="'+quizJS.quizTypes.HOTSPOT+'"]').find('.hotspot').removeClass("act");
        hs.addClass("act");
    }
};

/**
* Setzt in .gesucht das nächste Gesuchte Objekt ein
* gibt zurück ob ein nicht beantwortetes Objekt gefunden wurde (bool)
*/
quizJS.hotspotNextObject = function(root) {
    var doShuffle = root.find('.hotspot_image').is('.shuffle');

    var ans = root.find('a.ans').not('.used');
    if(doShuffle) {
        quizJS.shuffle(ans);
    }

    root.find('.gesucht,.task').html(ans.first().attr('id'));
    ans.first().addClass("used");

    return ans.length > 0;
};

quizJS.calculateHotspotDimensions = function() {
    var root = $('[qtype="'+quizJS.quizTypes.HOTSPOT+'"]');

    root.each(function(i, e) {
        quizJS.calculateHotspotDimension($(e));
    });
};

quizJS.calculateHotspotDimension = function(question) {
    if(!question.is('[qtype="'+quizJS.quizTypes.HOTSPOT+'"]')) return;
    var imgWidth = question.find('.hotspot_image').width();
    var width = imgWidth * 0.05;

    question.find('.hotspot_image').find('.hotspot').css({
        "width" : width + "px",
        "height" : width + "px",
        "margin-top": "-" + (width/2) + "px",
        "margin-left": "-" + (width/2) + "px"
    });
};

quizJS.calculateHotspotDescriptions = function(root) {
    var descr_margin = {
        top : 5,
        left : 0
    };

    root.each(function(i, e) {
        var imgWidth = root.find('.hotspot_image').width();
        var width = imgWidth * 0.05;


        var hs_img = $(e).find('.hotspot_image').find('img');

        var hss = $(e).find('.hotspot_image').find('.hotspot');

        hss.each(function(i,e) {
            hs = $(e);
            if(hs.find('.descr').length > 0) {
                var hs_width = hs.width();
                var des_width = hs.find('.descr').outerWidth();
                var des_height = hs.find('.descr').outerHeight();

                var top = (hs_width + descr_margin.top) + "px";
                var left = 0;

                // zu hoch um darunter angezeigt zu werden
                if((hs.offset().top
                    - hs_img.offset().top
                    + hs_width
                    + des_height
                    + descr_margin.top)
                    > hs_img.height()) {
                    top = "-" + (des_height + descr_margin.top) + "px";
                }

                // zu breit um nach rechts angezeigt zu werden
                if((hs.offset().left
                    - hs_img.offset().left
                    + hs_width
                    + des_width
                    + descr_margin.left)
                    > hs_img.width()) {
                    left = "-" + (des_width - hs_width - descr_margin.left) + "px";
                }

                hs.find('.descr').css({
                    "top" : top,
                    "left" : left
                });
            }
        });
    });
};

quizJS.blockHotspot = function(div) {
    div.find('.hotspot').addClass('blocked');
};


quizJS.findCorrectsHotspot = function(div) {
    var hss = div.find('.hotspot');
    var ans = div.find('a.ans');

    hss.each(function(i,e) {
        var hs = $(e);
        // bisher nicht korrekt
        if(hs.find('.cor').length == 0) {
            var id = hs.attr("id");
            var enc = quizJS.encryptMD5(id);

            ans.each(function(ii, ee) {
                // korrekte antwort
                if($(ee).html() == enc) {
                    hs.find('.descr').prepend("<div class='cor'>"+$(ee).attr("id")+"</div>");
                }
            });
        }
    });
};



// ---------------------------------- PETRI IMAGE --------------------------------------

quizJS.initiatePetriImage = function() {
    var root = $('[qtype="'+quizJS.quizTypes.PETRI+'"]');

    root.each(function(i,e) {
        var div = $(this);


        div.find('.petri_image').find('img').hide();
        div.find('.petri_image').find('img').first().show();

        div.find('.petri_aufgabe,.petri_task').find('img').hide();
        div.find('.petri_aufgabe,.petri_task').find(
            '#'+div.find('.petri_image').find('img').first().attr("id")).show();

        div.find('.gesucht,.task').html(div.find('.petri_image').find('img').first().attr("task"));

        // Klicken auf Hotspot
        div.find('.place').click(function() {
            quizJS.petriClick($(this));
        });

        // berechnet Größe der Plätze
        quizJS.calculatePetriDimensions();
    });
};


quizJS.petriClick = function(element) {
    var div = element.closest('.question');
    if(!element.is(".blocked") && !div.is('.show_feedback')) {
        if(element.is(".act")) {
            element.removeClass("act");
        }
        else {
            element.addClass("act");
        }
    }
};

quizJS.petriShowCorrectBG = function(div) {
    var imgs = div.find('.petri_image').find('img.correct');

    var act_img = div.find('.petri_image').find('img:visible');

    var cor_img = imgs.filter('#'+act_img.attr('id'));

    if(cor_img.length > 0) {
        act_img.hide();
        cor_img.show();
    }
};

quizJS.petriNextImage = function(div) {
    var imgs = div.find('.petri_image').find('img').not('.correct');

    var act_img = div.find('.petri_image').find('img:visible');

    var idx = imgs.index(imgs.filter('#'+act_img.attr("id")));

    if(imgs.length > idx + 1) {
        next_img = $(imgs.get(idx+1));

        act_img.hide();
        next_img.show();
    }
};

quizJS.petriNextAufgabenImage = function(div) {
    div.find('.petri_aufgabe,.petri_task').find('img').hide();
    div.find('.petri_aufgabe,.petri_task').find('#'+div.find('.petri_image').find('img:visible').attr("id")).show();
};

quizJS.petriNextPart = function(div) {
    div.find('.feedback').hide();
    quizJS.petriNextImage(div);
    quizJS.petriNextAufgabenImage(div);
    div.find('.gesucht,.task').html(div.find('.petri_image').find('img:visible').attr("task"));
};

quizJS.petriFinished = function(div) {
    var finished = false;

    var act_img = div.find('.petri_image').find('img:visible');

    var idx = div.find('.petri_image').find('img').index(act_img);

    if(idx >= div.find('.petri_image').find('img').length - 1) {
        finished = true;
    }

    return finished;
};

quizJS.blockPetri = function(div) {
    div.find('.place').addClass("blocked");
};


quizJS.calculatePetriDimensions = function() {
    var root = $('[qtype="'+quizJS.quizTypes.PETRI+'"]');

    root.each(function(i, e) {
        quizJS.calculatePetriDimension($(e));
    });
};

quizJS.calculatePetriDimension = function(question) {
    if(!question.is('[qtype="'+quizJS.quizTypes.PETRI+'"]')) return;
    var imgWidth = question.find('.petri_image').width();
    var width = imgWidth * 0.05;

    question.find('.petri_image').find('.place').css({
        "width" : width + "px",
        "height" : width + "px",
        "margin-top": "-" + (width/2) + "px",
        "margin-left": "-" + (width/2) + "px"
    });
};


// --------------------------------------------------------------------------------------

/**
* Streicht das Wort durch oder entfernt den Strich beim Draufklicken.
*/
quizJS.toggleErrorButton = function(button) {
    if(!$(button).parent().parent().is(".answered")) {
        if($(button).is(".act")) {
            $(button).removeClass("act");
        }
        else {
            $(button).addClass("act");
        }
    }

};


/**
* Entfernt für alle übergebenen Labels die färbenden Klassen "right" und "wrong"
*/
quizJS.deleteLabelColoring = function(div) {
    div.removeClass('right');
    div.removeClass('wrong');
    div.find('.right').removeClass('right');
    div.find('.wrong').removeClass('wrong');
    div.removeClass('right_icon');
    div.removeClass('wrong_icon');
    div.find('.right_icon').removeClass('right_icon');
    div.find('.wrong_icon').removeClass('wrong_icon');
};

/**
* Gibt zurück, ob val in dem array vorhanden ist.
* Es wird auch auf Typ-Gleichheit geprüft.
*/
quizJS.contains = function(array, val) {
    var found = false;
    for(var i=0; i<array.length; i++) {
        if(array[i] === val) {
            found = true;
        }
    }
    return found;
};



quizJS.quizTimer = null;

/**
* initialisiert Timer für alle Aufgaben die welche haben
* Sollte nur einmal zu Beginn aufgerufen werden
*/
quizJS.initTimers = function() {
    $('.question').each(function(i, e) {
        const el = $(e);

        // add unique question id if not set
        if(!el.attr('question-id')) {
            el.attr('question-id', quizJS.nextQuestionId);
            quizJS.nextQuestionId++;
        }
        const qId = el.attr('question-id');

        // will work in FireFox, Chrome Engine Browsers, Edge
        try {
            var options = {
                root: document.body,
                rootMargin: '0px',
                threshold: 1.0
            }

            var observer = new IntersectionObserver(function(entries, observer) {
                for(var i=0; i<entries.length; i++) {
                    var entry = entries[i];
                    quizJS.quizVisibilityUpdate($(entry.target));
                }
            }, options);

            observer.observe(el.get(0));
        } catch(e) {
            // ignore;
        }
        // resizesensor as visibility listener this will only work with Chrome engine browsers
        try {
            new ResizeSensor(el, function(dim) {
                quizJS.quizVisibilityUpdate(el);
            });
        } catch(e) {
            // ignore;
        }

        quizJS.quizVisibilityUpdate(el);

        // add starttime
        var max_time = el.attr("max-time");
        if(max_time != undefined && max_time.length != 0) {
            max_time = parseInt(max_time);
            el.find('.answered_hint.timer').remove();
            el.find("h4").after("<div class='answered_hint timer'>"
                            + max_time + ":00</div>");
        }
    });

    quizJS.updateTimers();

    return;
};

quizJS.quizVisibilityUpdate = function(question) {
    const qId = question.attr('question-id');

    if(question.is(':visible') !== quizJS.questionVisibility[qId]
        || quizJS.questionVisibility[qId] == undefined) {
        quizJS.questionVisibility[qId] = question.is(':visible');
        // was set to visible
        if(quizJS.questionVisibility[qId]) {
            // update start time, so further time calculation is correct
            if(quizJS.start_time[qId] != undefined
                    && quizJS.passed_time[qId] != undefined) {
                quizJS.start_time[qId] = Date.now() - quizJS.passed_time[qId]*1000;
            }
            // set new quizJS.start_time and quizJS.passed_time
            else {
                quizJS.start_time[qId] = new Date();
                quizJS.passed_time[qId] = 0;
            }
        }
    }
};

quizJS.updateQuestionVisibility = function() {
    $('.question').each(function(i, e) {
        const el = $(e);
        quizJS.quizVisibilityUpdate(el);
    });
};

/**
* Aktualisieren aller Timer
*/
quizJS.updateTimers = function() {
    $('.question .answered_hint.timer:visible').each(function(i, e) {
        const timer = $(e);
        const question = timer.closest('.question');
        const qId = question.attr('question-id');

        if(!quizJS.questionVisibility[qId]
            || quizJS.start_time[qId] == undefined
            || question.is('.answered')) return true;

        var diff = (Date.now() - quizJS.start_time[qId])/1000;
        quizJS.passed_time[qId] = diff;

        // time in seconds
        var time = parseInt(question.attr("max-time")) * 60;
        var time_left = time - diff;

        if(time_left > 0) {
            var min = Math.floor(time_left/60);
            var sec = Math.floor(time_left - min*60);
            if(sec < 10) {
                sec = "0" + sec;
            }
            timer.html(min + ":" + sec);
        }
        else if(!question.is('.answered')) {
            quizJS.finishQuestion(question);
            quizJS.blockQuestion(question);
            question.find('.feedback.noselection').hide();

            var timeup = $("<div lang-code='timeup' class='feedback timeup'></div>");
            question.append(timeup);
            quizJS.localizeElement(timeup);

            if(quizJS.timerAlertActive) {
                alert(quizJS.timerAlertText);
            }
        }
    });

    clearTimeout(quizJS.quizTimer);
    quizJS.quizTimer = setTimeout(function() { quizJS.updateTimers(); }, 1000);
};


/**
* Mischt die Antwortenreihenfolge bei dafür markierten Fragen.
*/
quizJS.shuffleAnswers = function() {
    $("div.answers").filter(".shuffle").each(function(i) {
        var labels = $(this).children("label");
        quizJS.shuffle(labels);
        $(labels).remove();
        $(this).append($(labels));
        $(this).removeClass("shuffle");
    });
};

/**
* Ersetzt alle Inputs mit "rnd" als Value und %rnd im Text durch Werte aus dem vorgegebenem Wertebereich.
*/
quizJS.replaceRandoms = function() {
    $("div.answers").filter(".rnd").each(function(i) {
        var bereich = $(this).attr('class').replace("answers", "").replace("rnd","").replace("shuffle","").replace(/\s+/, "");
        var min = parseInt(bereich.split("-")[0]);
        var max = parseInt(bereich.split("-")[1]);
        var mul = parseInt(bereich.split("-")[2]);
        var inputs = $(this).children("label").children("input").filter(".rnd");
        var ohneZahlen = [];
        $(this).children("label").children("input").not(".rnd").each(function(j,c) {
            ohneZahlen[ohneZahlen.length] = parseInt($(c).val())/mul;
        });
        var randoms = quizJS.zufallsArray(ohneZahlen, inputs.length, min, max);
        $(inputs).each(function(j, c) {
            $(this).removeClass("rnd");
            $(this).val(randoms[j]*mul);
            $(this).parent().html($(this).parent().html().replace("%rnd", randoms[j]*mul));
        });
        $(this).removeClass("rnd");
        $(this).removeClass(bereich);
    });
};

/**
    Gibt eine ganze Zufallszahl zwischen der unteren und oberen Grenze (beide enthalten) zurück.
*/
quizJS.randomInt = function(untereGrenze, obereGrenze) {
    var x = Math.floor((Math.random() * (obereGrenze-untereGrenze+1)) + untereGrenze);
    return x;
};

/**+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/quizJS.shuffle [v1.0] */
quizJS.shuffle = function(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

/**
    Gibt ein Array zurück mit 'anzahl' Zufallszahlen zwischen untereG. und obereG. ohne die 'ohneZahl'
*/
quizJS.zufallsArray = function(ohneZahlen, anzahl, untereGrenze, obereGrenze) {
    var zufallArray = [];
    var x=0;
    do{
        x=quizJS.randomInt(untereGrenze, obereGrenze);
        if($.inArray(x, zufallArray) == -1 && $.inArray(x, ohneZahlen) == -1) zufallArray[zufallArray.length] = x;
    } while(zufallArray.length < anzahl);
    return zufallArray;
};



/**
* Bricht die Antworten in neue Zeile unter das Bild, falls das Bild mehr als 60%
* der Breite einnimmt oder die Antworten mehr als 2 mal so hoch wie das Bild sind.
*/
quizJS.windowResizing = function() {
    $('div.question').each(function(i, e) {
        quizJS.resizeQuestion($(e));
    });
};

quizJS.resizeQuestion = function(question) {
    var maxWidth = 0;
    var maxHeight = 0;
    question.children('img').each(function() {
        maxWidth = Math.max(maxWidth, question.width());
        maxHeight = Math.max(maxHeight, question.outerHeight());
    });


    if(maxWidth*100/$('.question:visible').width() > 80 || $('.question:visible').children('div.answers').outerHeight() > 2*maxHeight) {
        question.children('img').css("float", "none");
        question.children('div.answers').css("padding-left", "0");
    }
    else {
        question.children('img').css("float", "left");
        question.children('div.answers').css("padding-left", maxWidth + "px");
    }

    quizJS.calculateHotspotDimension(question);
    quizJS.calculatePetriDimension(question);
    quizJS.calculateCanvasDimension(question);
};


/**
* Setzt eine Frage auf den Anfangszustand zurück
*/
quizJS.resetQuestion = function(div) {
    div.removeClass("answered");
    div.find(".feedback").hide();
    quizJS.deleteLabelColoring(div);

    div.find("input:text").val("");
    div.find("input:radio").prop("checked", false);
    div.find("input:checkbox").prop("checked", false);

    div.find('textarea').attr('readonly', false);
    div.find('textarea').val("");
    div.find("select").attr("disabled", false);
    div.find("input").attr("disabled", false);

    // Zuordnung (Classfication)
    div.find('.used').removeClass("used");
    div.find('.full').children().remove();
    div.find('.full').removeClass("full");

    // alle geblockten elemente (mehrfach benutzt)
    div.find('.blocked').removeClass("blocked");

    // alle aktiven elemente (mehrfach benutzt)
    div.find('.act').removeClass("act");

    // hotspot
    div.find('.hotspot').find('.descr').children().remove();

    // petrinetz
    div.filter('[qtype="'+quizJS.quizTypes.PETRI+'"]').find('.petri_image').find('img').hide();
    div.filter('[qtype="'+quizJS.quizTypes.PETRI+'"]').find('.petri_aufgabe,.petri_task').find('img').hide();
    // erste aufgabe anzeigen
    div.filter('[qtype="'+quizJS.quizTypes.PETRI+'"]').find('.petri_image').find('img').first().show();
    div.filter('[qtype="'+quizJS.quizTypes.PETRI+'"]').find('.petri_aufgabe,.petri_task').find('img')
        .filter('#'+div.find('.petri_image').find('img:visible').attr("id")).show();
    div.filter('[qtype="'+quizJS.quizTypes.PETRI+'"]').find('.gesucht,.task').html(div.find('.petri_image').find('img').first().attr("task"));

    quizJS.resetCanvas(div);

    div.nextAll("button.quizButton.solve").first().show();
    div.nextAll("button.quizButton.reset").first().hide();
};

/**
* Setzt alle Fragen des Quiz' auf den Anfangszustand zurück.
*/
quizJS.resetQuiz = function() {
    $(".question").removeClass("answered");
    $(".feedback").hide();
    quizJS.deleteLabelColoring($("label"));
    $("input:text").val("");
    $("input:radio").prop("checked", false);
    $("input:checkbox").prop("checked", false);

    $('.question').find('textarea').attr('readonly', false);

    $(".question").each(function() {
        quizJS.resetQuestion($(this));
    });
};



/** **************************************************************************
*                                                                            *
*                                                                            *
*                             DRAWING CANVAS                                 *
*                                                                            *
*                                                                            *
******************************************************************************/
// Für jede Frage wird hinterlegt, welcher Canvas angezeigt wird
// genutzt für rückgängig/wiederholen Funktion
quizJS.canvasIndex = [];

/**
* Initialisiert alle DrawingCanvas Elemente. Für Jede Frage dieses Typs.
*/
quizJS.initiateDrawingCanvas = function() {
    var root = $('[qtype="'+quizJS.quizTypes.DRAW+'"]');

    root.each(function(i,e) {
        var div = $(this);

        div.addClass("unranked");

        quizJS.resetCanvas(div);

        // Container für zusätzliche Steuerelemente
        div.find('.drawing_canvas_container').after('<div class="button_container"></div>');

        // Rückgängig und Wiederholen
        if(!div.find('.drawing_canvas_container').is('.no_steps')) {
            var redo = $('<button lang-code="canvas.redo" class="stepforw"></button>');
            div.find('.button_container').append(redo);
            quizJS.localizeElement(redo);
            div.find('.button_container').append('<br>');
            div.find('.stepforw').click(function() {
                quizJS.canvasStepForward(div.find('.drawing_canvas_container'));
            });

            var undo = $('<button lang-code="canvas.undo" class="stepback"></button>');
            div.find('.button_container').append(undo);
            quizJS.localizeElement(undo);
            div.find('.button_container').append('<br>');
            div.find('.stepback').click(function() {
                quizJS.canvasStepBack(div.find('.drawing_canvas_container'));
            });
        }

        // Bild komplett löschen Button
        var clear = $('<button lang-code="canvas.clear" class="clear"></button>');
        div.find('.button_container').append(clear);
        quizJS.localizeElement(clear);
        div.find('.clear').click(function() {
            quizJS.resetCanvas(div);
        });

        quizJS.calculateCanvasDimensions();
    });
};

/**
* Skaliert sichtbare Canvas auf aktuelle Größe
* Falls nötig werden dabei die canvas inhalte neu gezeichnet
*/
quizJS.calculateCanvasDimensions = function() {
    var root = $('[qtype="'+quizJS.quizTypes.DRAW+'"]:visible');

    root.each(function(i,e) {
        quizJS.calculateCanvasDimension($(e));
    });
};

quizJS.calculateCanvasDimension = function(div) {
    if(!div.is('[qtype="'+quizJS.quizTypes.DRAW+'"]:visible')) return;
    div.find('canvas').each(function(ii,ee) {
        // canvas to scale
        var canvas = $(this);

        // clear prev. timeouts if existent
        if(this.redrawTimeout != undefined && this.redrawTimeout != null) {
            clearTimeout(this.redrawTimeout);
        }

        // create new timeout
        var timeout = setTimeout(function() {
            // clone before resize
            var oldCanvas = canvas[0];
            var newCanvas = document.createElement('canvas');
            var context = newCanvas.getContext('2d');
            newCanvas.width = oldCanvas.width;
            newCanvas.height = oldCanvas.height;
            context.drawImage(oldCanvas, 0, 0);

            // change dimensions
            canvas.attr("width", canvas.width());
            canvas.attr("height", canvas.height());

            // redraw frome cloned canvas
            oldCanvas.getContext('2d').drawImage(newCanvas, 0, 0, canvas.width(), canvas.height());
            $(newCanvas).remove();
        }, 100);

        // add this timeout to the element
        this.redrawTimeout = timeout;
    });
};

/**
* Stellt den Startzustand wieder her.
*
* alle <canvas> Elemente werden entfernt
* neuere original canvas wird erstellt und DrawingCanvas initialisiert
* quizJS.canvasIndex wird zurückgesetzt.
* block wird aufgehoben
*/
quizJS.resetCanvas = function(div) {
    if(div.is('[qtype="'+quizJS.quizTypes.DRAW+'"]')) {
        div.find('canvas').remove();
        div.find('.drawing_canvas_container').append('<canvas class="drawing_canvas act"></canvas>');
        quizJS.createDrawingCanvas(div.find('.drawing_canvas_container').find('canvas'),
                            quizJS.getCanvasStrokeColor(div));

        quizJS.setCanvasIndex(div.find('.drawing_canvas_container'), 0);
        div.find('.drawing_canvas_container').removeClass(".blocked");
        quizJS.calculateCanvasDimensions();
    }
};

/**
* Geht einen gezeichneten Schritt zurück
*
* Dazu wird der ältere Canvas wieder angezeigt und der quizJS.canvasIndex angepasst
*/
quizJS.canvasStepBack = function(div) {
    var c_Idx = quizJS.getCanvasIndex(div);

    var canvasList = div.find('canvas').not('#imageTemp');

    if(c_Idx > 0) {
        canvasList.removeClass("act");
        $(canvasList.get(c_Idx - 1)).addClass("act");
        quizJS.setCanvasIndex(div, quizJS.getCanvasIndex(div)-1);
    }
};

/**
* Wiederholt einen gezeichneten Schritt
*
* Dazu wird der neuere Canvas wieder angezeigt und der quizJS.canvasIndex angepasst
*/
quizJS.canvasStepForward = function(div) {
    var c_Idx = quizJS.getCanvasIndex(div);

    var canvasList = div.find('canvas').not('#imageTemp');

    if(c_Idx < canvasList.length - 1) {
        canvasList.removeClass("act");
        $(canvasList.get(c_Idx + 1)).addClass("act");
        quizJS.setCanvasIndex(div, quizJS.getCanvasIndex(div)+1);
    }
};

/**
* Gibt den aktuell angezeigten quizJS.canvasIndex für ein .drawing_canvas_container Element zurück
*/
quizJS.getCanvasIndex = function(div) {
    var draw_can = $('[qtype="'+quizJS.quizTypes.DRAW+'"]').find('.drawing_canvas_container');

    return quizJS.canvasIndex[draw_can.index(div)];
};

/**
* Setzt den aktuell angezeigten quizJS.canvasIndex auf idx für ein .drawing_canvas_container Element
*/
quizJS.setCanvasIndex = function(div, idx) {
    var draw_can = $('[qtype="'+quizJS.quizTypes.DRAW+'"]').find('.drawing_canvas_container');

    quizJS.canvasIndex[draw_can.index(div)] = idx;
};

/**
* Gibt einen Farbcode String zurück wie zB "#FF0000" für eine Zeichenaufgabe
*
* @param: div - das div.question[qtype=quizJS.quizTypes.DRAW]
*/
quizJS.getCanvasStrokeColor = function(root) {
    var color = "#000000";

    var div = root.find('.drawing_canvas_container');

    if(div.is('.black')) {
        color = "#000000";
    }
    else if(div.is(".red")) {
        color = "#FF0000";
    }
    else if(div.is(".green")) {
        color = "#00FF00";
    }
    else if(div.is(".blue")) {
        color = "#0000FF";
    }
    else if(div.is(".cyan")) {
        color = "#00FFFF";
    }
    else if(div.is(".yellow")) {
        color = "#FFFF00";
    }
    else if(div.is(".orange")) {
        color = "#FF8000";
    }
    else if(div.is(".purple")) {
        color = "#FF00FF";
    }
    else if(div.css("color") != undefined) {
        color = div.css("color");
    }

    return color;
};

/* © 2009 ROBO Design
 * http://www.robodesign.ro
 */

// Keep everything in anonymous function, called on window load.
quizJS.createDrawingCanvas = function(element, color) {

  quizJS.initTouchToMouse(element.closest('.drawing_canvas_container'));

  var canvas, context, canvasoList, contextoList;
  var root = element.closest('.drawing_canvas_container');

  var strokeColor = color;

  // The active tool instance.
  var tool;
  var tool_default = 'pencil';

  function initCanvas() {

    canvasoList = [];
    contextoList = [];

    // Find the canvas element.
    canvasoList[0] = element[0];
    if (!canvasoList[0]) {
      //alert('Error: I cannot find the canvas element!');
      return;
    }

    if (!canvasoList[0].getContext) {
      //alert('Error: no canvas.getContext!');
      return;
    }

    // Get the 2D canvas context.
    contextoList[0] = canvasoList[0].getContext('2d');
    if (!contextoList[0]) {
      //alert('Error: failed to getContext!');
      return;
    }

    // Add the temporary canvas.
    var container = canvasoList[0].parentNode;
    canvas = document.createElement('canvas');
    if (!canvas) {
      //alert('Error: I cannot create a new canvas element!');
      return;
    }

    canvas.id     = 'imageTemp';
    canvas.width  = canvasoList[0].width;
    canvas.height = canvasoList[0].height;
    container.appendChild(canvas);

    context = canvas.getContext('2d');


    // Activate the default tool.
    if (tools[tool_default]) {
      tool = new tools[tool_default]();
    }

    // Attach the mousedown, mousemove and mouseup event listeners.
    canvas.addEventListener('mousedown', ev_canvas, false);
    canvas.addEventListener('mousemove', ev_canvas, false);
    canvas.addEventListener('mouseup',   ev_canvas, false);
  }

  // The general-purpose event handler. This function just determines the mouse
  // position relative to the canvas element.
  function ev_canvas (ev) {
    if(!root.is('.blocked')) {
      if (ev.layerX || ev.layerX == 0) { // Firefox
        ev._x = ev.layerX;
        ev._y = ev.layerY;
      } else if (ev.offsetX || ev.offsetX == 0) { // Opera
        ev._x = ev.offsetX;
        ev._y = ev.offsetY;
      }

      // Call the event handler of the tool.
      var func = tool[ev.type];
      if (func) {
        func(ev);
      }
    }
  }


  // This function draws the #imageTemp canvas on top of #imageView, after which
  // #imageTemp is cleared. This function is called each time when the user
  // completes a drawing operation.
  function img_update () {
    if(!root.is('no_steps')) {
        new_canvas();
    }
    contextoList[quizJS.getCanvasIndex(root)].drawImage(canvas, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function new_canvas() {
      // clear all others after this
      var canvasList = root.find('canvas').not('#imageTemp');
      for(var i = quizJS.getCanvasIndex(root)+1; i<canvasList.length; i++) {
          $(canvasList.get(i)).remove();
      }

      // create new canvas
      var canvas_new, context_new;
      canvas_new = document.createElement('canvas');
      canvas_new.className = "drawing_canvas";
      canvas_new.width  = canvasoList[0].width;
      canvas_new.height = canvasoList[0].height;

      context_new = canvas_new.getContext('2d');

      // copy active image to new
      context_new.drawImage(canvasoList[quizJS.getCanvasIndex(root)], 0, 0);

      // add to lists
      quizJS.setCanvasIndex(root, quizJS.getCanvasIndex(root)+1);
      canvasoList[quizJS.getCanvasIndex(root)] = canvas_new;
      contextoList[quizJS.getCanvasIndex(root)] = context_new;

      var container = canvasoList[0].parentNode;
      container.insertBefore(canvas_new, canvas);

      // show
      show_active_canvas();
  }

  function show_active_canvas() {
      for(var i=0; i<canvasoList.length; i++) {
          if(i == quizJS.getCanvasIndex(root)) {
              $(canvasoList[i]).addClass("act");
          }
          else {
              $(canvasoList[i]).removeClass("act");
          }
      }
  }

  // This object holds the implementation of each drawing tool.
  var tools = {};

  // The drawing pencil.
  tools.pencil = function () {
    var tool = this;
    this.started = false;

    // This is called when you start holding down the mouse button.
    // This starts the pencil drawing.
    this.mousedown = function (ev) {
        if(ev.which == 1) {
            context.beginPath();
            context.moveTo(ev._x, ev._y);
            tool.started = true;
        }
    };

    // This function is called every time you move the mouse. Obviously, it only
    // draws if the tool.started state is set to true (when you are holding down
    // the mouse button).
    this.mousemove = function (ev) {
      if (tool.started) {
        context.lineTo(ev._x, ev._y);
        context.strokeStyle = strokeColor;
        context.stroke();
      }
    };

    // This is called when you release the mouse button.
    this.mouseup = function (ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
        img_update();
      }
    };
  };

  // The rectangle tool.
  tools.rect = function () {
    var tool = this;
    this.started = false;

    this.mousedown = function (ev) {
      if(ev.which == 1) {
          tool.started = true;
          tool.x0 = ev._x;
          tool.y0 = ev._y;
      }
    };

    this.mousemove = function (ev) {
      if (!tool.started) {
        return;
      }

      var x = Math.min(ev._x,  tool.x0),
          y = Math.min(ev._y,  tool.y0),
          w = Math.abs(ev._x - tool.x0),
          h = Math.abs(ev._y - tool.y0);

      context.clearRect(0, 0, canvas.width, canvas.height);

      if (!w || !h) {
        return;
      }

      context.strokeRect(x, y, w, h);
    };

    this.mouseup = function (ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
        img_update();
      }
    };
  };

  // The line tool.
  tools.line = function () {
    var tool = this;
    this.started = false;

    this.mousedown = function (ev) {
      if(ev.which == 1) {
          tool.started = true;
          tool.x0 = ev._x;
          tool.y0 = ev._y;
      }
    };

    this.mousemove = function (ev) {
      if (!tool.started) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      context.beginPath();
      context.moveTo(tool.x0, tool.y0);
      context.lineTo(ev._x,   ev._y);
      context.stroke();
      context.closePath();
    };

    this.mouseup = function (ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
        img_update();
      }
    };
  };

  initCanvas();

  return this;
};

quizJS.setTimerAlert = function(bool, text) {
    quizJS.timerAlertActive = bool;
    quizJS.timerAlertText = text;
};

// --------------------------------------------------------------------------------------
// COPY QUESTION TO SHOW AGAIN
// --------------------------------------------------------------------------------------

/**
* Kopiert die Frage ohne Bestätigungsbuttons (reiner Fragekörper)
*/
quizJS.showQuestionHere = function(button) {
    var id = $(button).attr("id").replace("_ref", "");

    var orig = $('#'+id);

    var div = orig.clone();
    div.addClass("cloned");

    // zählt immer als beantwortet
    div.addClass("answered");

    // hinweis, dass nicht veränderbar
    div.find(".answered_hint").remove();
    var answered = $('<span lang-code="already_answered" class="answered_hint"></span>');
    div.find("h4").after(answered);
    quizJS.localizeElement(answered);

    var type = orig.attr("qtype");
    // Verarbeiten der vorherigen Eingaben
    if(type === quizJS.quizTypes.FREE_TEXT) {
        quizJS.copyFreeText(div, orig);
    }
    else if(type === quizJS.quizTypes.FILL_BLANK) {
        quizJS.copyFillBlank(div, orig);
    }
    else if(type === quizJS.quizTypes.FILL_BLANK_CHOICE) {
        quizJS.copyFillBlankChoice(div, orig);
    }
    else if(type === quizJS.quizTypes.HOTSPOT) {
        quizJS.copyHotspot(div);
    }
    else if(type === quizJS.quizTypes.DRAW) {
        quizJS.copyDrawing(div, orig);
    }

    quizJS.blockQuestion(div);


    var hideButton = $('<button lang-code="hide" class="free_text_ref" id="'+id+'_ref"></button>');
    hideButton.on('click', function(e) {
        quizJS.removeQuestionHere(hideButton);
    })
    $(button).before(div);
    $(button).before(hideButton)
    $(button).hide();
    quizJS.localizeElement(hideButton);
};

quizJS.removeQuestionHere = function(button) {
    $(button).prev().remove();
    $(button).next().show();
    $(button).remove();
};


quizJS.copyFreeText = function(div, orig) {
    div.find("textarea").val(orig.find("textarea").val());
};

quizJS.copyFillBlank = function(div, orig) {
    div.find("input").each(function(i, e) {
        // Kopiert ausgewählten Wert
        $(this).val($($(orig).find("input").get(i)).val());
    });
};

quizJS.copyFillBlankChoice = function(div, orig) {
    div.find("select").each(function(i, e) {
        // Kopiert ausgewählten Wert
        $(this).val($($(orig).find("select").get(i)).val());
    });
};


quizJS.copyHotspot = function(div) {
    // hover funktionen
    div.find('.hotspot').mouseover(function(event) {
        if($(this).find('.descr').children().length > 0) $(this).find('.descr').show();
        quizJS.calculateHotspotDescriptions($(this).closest('[qtype="'+quizJS.quizTypes.HOTSPOT+'"]'));
    });
    div.find('.hotspot').mouseout(function(event) {
        $(this).find('.descr').hide();
    });
};

quizJS.copyDrawing = function(div, orig) {
    var canvas_orig = orig.find('.drawing_canvas_container').find('canvas.drawing_canvas.act')[0];
    var canvas = div.find('.drawing_canvas_container').find('canvas.drawing_canvas.act')[0];

    div.find('.drawing_canvas_container').find('canvas').not('.act').remove();

    div.find('.button_container').remove();
    div.find('.feedback.correct').show();

    canvas.getContext('2d').drawImage(canvas_orig, 0, 0);
};

quizJS.blockQuestion = function(div) {
    div.addClass("answered");

    var type = div.attr("qtype");

    if(type === quizJS.quizTypes.FREE_TEXT) {
        div.find("textarea").attr("readonly", "readonly");
    }
    else if(type === quizJS.quizTypes.SHORT_TEXT
            || type === quizJS.quizTypes.CHOICE
            || type === quizJS.quizTypes.FILL_BLANK
            || type === quizJS.quizTypes.MATRIX_CHOICE
            || type == undefined) {
        // Disabled jedes input
        div.find("input").attr("disabled", true);
    }
    else if(type === quizJS.quizTypes.FILL_BLANK_CHOICE) {
        div.find("select").attr("disabled", true);
    }
    else if(type === quizJS.quizTypes.CLASSIFICATION
            || type === quizJS.quizTypes.ORDER) {
        div.find('.object').addClass("blocked");
    }
    else if(type === quizJS.quizTypes.HOTSPOT) {
        div.find('.hotspot').addClass("blocked");
    }
    else if(type === quizJS.quizTypes.PETRI) {
        div.find('.place').addClass("blocked");
    }
    else if(type === quizJS.quizTypes.DRAW) {
        div.find('.drawing_canvas_container').addClass("blocked");
    }
};

/**
* Konvertiert Touch events in mouse events für DrawingCanvas auf Touchgeräten.
*/
quizJS.touchHandler = function(event)
{
    event = event.originalEvent;
    var touches = event.changedTouches,
        first = touches[0],
        type = "";
    switch(event.type)
    {
        case "touchstart": type = "mousedown"; break;
        case "touchmove":  type = "mousemove"; break;
        case "touchend":   type = "mouseup";   break;
        default:           return;
    }

    // initMouseEvent(type, canBubble, cancelable, view, clickCount,
    //                screenX, screenY, clientX, clientY, ctrlKey,
    //                altKey, shiftKey, metaKey, button, relatedTarget);

    var simulatedEvent = document.createEvent("MouseEvent");

    simulatedEvent.initMouseEvent(type, true, true, window, 1,
                                  first.screenX, first.screenY,
                                  first.clientX, first.clientY, false,
                                  false, false, false, 0/*left*/, null);

    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
    event.stopPropagation();
};

/**
* Initialisiert das Touch->Mouse für ein Element.
*/
quizJS.initTouchToMouse = function(element)
{
    element.on("touchstart", quizJS.touchHandler);
    element.on("touchmove", quizJS.touchHandler);
    element.on("touchend", quizJS.touchHandler);
    element.on("touchcancel", quizJS.touchHandler);
};


/** *********************************************************************
*                                                                       *
*  MD5 Part                                                             *
*                                                                       *
* ******************************************************************** */

quizJS.encryptMD5 = function(str) {
  //  discuss at: http://phpjs.org/functions/md5/
  // original by: Webtoolkit.info (http://www.webtoolkit.info/)
  // improved by: Michael White (http://getsprink.com)
  // improved by: Jack
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //    input by: Brett Zamir (http://brett-zamir.me)
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //  depends on: quizJS.utf8_encode
  //   example 1: md5('Kevin van Zonneveld');
  //   returns 1: '6e658d4bfcb59cc13f96c14450ac40b9'

  var xl;

  var rotateLeft = function (lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  };

  var addUnsigned = function (lX, lY) {
    var lX4, lY4, lX8, lY8, lResult;
    lX8 = (lX & 0x80000000);
    lY8 = (lY & 0x80000000);
    lX4 = (lX & 0x40000000);
    lY4 = (lY & 0x40000000);
    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) {
      return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
      } else {
        return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
      }
    } else {
      return (lResult ^ lX8 ^ lY8);
    }
  };

  var _F = function (x, y, z) {
    return (x & y) | ((~x) & z);
  };
  var _G = function (x, y, z) {
    return (x & z) | (y & (~z));
  };
  var _H = function (x, y, z) {
    return (x ^ y ^ z);
  };
  var _I = function (x, y, z) {
    return (y ^ (x | (~z)));
  };

  var _FF = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var _GG = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var _HH = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var _II = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var convertToWordArray = function (str) {
    var lWordCount;
    var lMessageLength = str.length;
    var lNumberOfWords_temp1 = lMessageLength + 8;
    var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    var lWordArray = new Array(lNumberOfWords - 1);
    var lBytePosition = 0;
    var lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  };

  var wordToHex = function (lValue) {
    var wordToHexValue = '',
      wordToHexValue_temp = '',
      lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValue_temp = '0' + lByte.toString(16);
      wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
    }
    return wordToHexValue;
  };

  var x = [],
    k, AA, BB, CC, DD, a, b, c, d, S11 = 7,
    S12 = 12,
    S13 = 17,
    S14 = 22,
    S21 = 5,
    S22 = 9,
    S23 = 14,
    S24 = 20,
    S31 = 4,
    S32 = 11,
    S33 = 16,
    S34 = 23,
    S41 = 6,
    S42 = 10,
    S43 = 15,
    S44 = 21;


  str = quizJS.utf8_encode(str);
  x = convertToWordArray(str);
  a = 0x67452301;
  b = 0xEFCDAB89;
  c = 0x98BADCFE;
  d = 0x10325476;

  xl = x.length;
  for (k = 0; k < xl; k += 16) {
    AA = a;
    BB = b;
    CC = c;
    DD = d;
    a = _FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
    d = _FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
    c = _FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
    b = _FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = _FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
    d = _FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
    c = _FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
    b = _FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = _FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
    d = _FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
    c = _FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
    b = _FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = _FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
    d = _FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
    c = _FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
    b = _FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
    a = _GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
    d = _GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
    c = _GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
    b = _GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
    a = _GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
    d = _GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = _GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
    b = _GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = _GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
    d = _GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
    c = _GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
    b = _GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = _GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
    d = _GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
    c = _GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
    b = _GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
    a = _HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
    d = _HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
    c = _HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
    b = _HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = _HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
    d = _HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
    c = _HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
    b = _HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = _HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
    d = _HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
    c = _HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
    b = _HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
    a = _HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
    d = _HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
    c = _HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
    b = _HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
    a = _II(a, b, c, d, x[k + 0], S41, 0xF4292244);
    d = _II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
    c = _II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
    b = _II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = _II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
    d = _II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
    c = _II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
    b = _II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = _II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
    d = _II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
    c = _II(c, d, a, b, x[k + 6], S43, 0xA3014314);
    b = _II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = _II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
    d = _II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
    c = _II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
    b = _II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);

  return temp.toLowerCase();
};

quizJS.utf8_encode = function(argString) {
  //  discuss at: http://phpjs.org/functions/quizJS.utf8_encode/
  // original by: Webtoolkit.info (http://www.webtoolkit.info/)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: sowberry
  // improved by: Jack
  // improved by: Yves Sucaet
  // improved by: kirilloid
  // bugfixed by: Onno Marsman
  // bugfixed by: Onno Marsman
  // bugfixed by: Ulrich
  // bugfixed by: Rafal Kukawski
  // bugfixed by: kirilloid
  //   example 1: quizJS.utf8_encode('Kevin van Zonneveld');
  //   returns 1: 'Kevin van Zonneveld'

  if (argString === null || typeof argString === 'undefined') {
    return '';
  }

  var string = (argString + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  var utftext = '',
    start, end, stringl = 0;

  start = end = 0;
  stringl = string.length;
  for (var n = 0; n < stringl; n++) {
    var c1 = string.charCodeAt(n);
    var enc = null;

    if (c1 < 128) {
      end++;
    } else if (c1 > 127 && c1 < 2048) {
      enc = String.fromCharCode(
        (c1 >> 6) | 192, (c1 & 63) | 128
      );
    } else if ((c1 & 0xF800) != 0xD800) {
      enc = String.fromCharCode(
        (c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
      );
    } else { // surrogate pairs
      if ((c1 & 0xFC00) != 0xD800) {
        throw new RangeError('Unmatched trail surrogate at ' + n);
      }
      var c2 = string.charCodeAt(++n);
      if ((c2 & 0xFC00) != 0xDC00) {
        throw new RangeError('Unmatched lead surrogate at ' + (n - 1));
      }
      c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
      enc = String.fromCharCode(
        (c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
      );
    }
    if (enc !== null) {
      if (end > start) {
        utftext += string.slice(start, end);
      }
      utftext += enc;
      start = end = n + 1;
    }
  }

  if (end > start) {
    utftext += string.slice(start, stringl);
  }

  return utftext;
};
