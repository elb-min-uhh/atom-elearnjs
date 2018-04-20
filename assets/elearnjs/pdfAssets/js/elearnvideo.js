$(document).ready(function() {
    $('.video_notes').each(function(i, e) {
        eLearnVideoJS.showAllNotes($(e), true);

        // sort by time
        /**
        $(e).find('.video_note').sort(function(a,b) {
            var timeA = $(a).attr("timefrom");
            var timeB = $(b).attr("timefrom");
            return timeA == undefined ? -1 :
                    (timeB == undefined ? 1 :
                        (parseInt(eLearnVideoJS.parseTimeString(timeA))
                            - parseInt(eLearnVideoJS.parseTimeString(timeB))));
        }).appendTo(e);
        */
    });
});
