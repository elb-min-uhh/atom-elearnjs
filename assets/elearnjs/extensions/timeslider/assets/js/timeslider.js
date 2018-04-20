/*
 * timeslider.js
 *
 * Author:  Lars Thoms <lars.thoms@spacecafe.org>
 * Version: 2016-06-27
 *
 * This script is part of the timeslider.js-addon of eLearn.js
 * timeslider.js used vanilla javascript and moment.js to calculate dates
 *
 */


/* ====[ Configuration ]===================================================== */

/* Namespace */
var timesliderJS = timesliderJS || {};


/* ====[ Code ]============================================================== */

timesliderJS.MonthDE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

/*
 * shortMonth()
 *
 * Param:  string
 * Return: string
 *
 * Show specific page and hide other
 *
 */
timesliderJS.shortMonth = function(month)
{
    return (month.length > 4 ? month.substring(0,3) + '.' : month);
};


/*
 * parseDate()
 *
 * Param:  string, object
 * Return: array(moment)
 *
 * Parse given date(-ranges)
 * Valid German date format:
 *   DD. MMMM YYYY (eg. 01. Januar 2016)
 *       MMMM YYYY (eg. Januar 2016)
 *            YYYY (eg. 2016)
 *   DD. MMMM YYYY n.Chr. (eg. 01. Januar 2016 n.Chr.)
 *   DD. MMMM YYYY v.Chr. (eg. 01. Januar 2016 v.Chr.)
 *   ...
 *
 */

timesliderJS.parseDate = function(date, info)
{
    var tmp_date = date.split(' - ');
    var tmp_range = [];
    var regex = /^(?:(?:(\d{1,2})\. )?(?:(\w+) )?(\d{1,4})(?: (n\.Chr\.|v\.Chr\.))?)?(?: )?(?:(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/;
    for(var i = 0; i < tmp_date.length; i++)
    {
        var match = regex.exec(tmp_date[i]);
        var month = timesliderJS.MonthDE.indexOf(match[2]);

        tmp_range.push(moment({
                year:         (match[3] ? ((match[4] == 'v.Chr.' ? -1 : 1) * match[3]) : 0),
                month:        (month > 0 ? month : 0),
                date:         (match[1] ? match[1] : 1),
                hour:         (match[5] ? match[5] : 0),
                minute:       (match[6] ? match[6] : 0),
                seconds:      (match[7] ? match[7] : 0),
                milliseconds: (match[8] ? match[8] : 0)
            }));
        info.first = (info.first === undefined ? tmp_range[i] : moment.min(info.first, tmp_range[i]));
        info.last = (info.last === undefined ? tmp_range[i] : moment.max(info.last, tmp_range[i]));
    }
    return tmp_range;
}


/*
 * showPage()
 *
 * Param:  Node, int
 * Return: void
 *
 * Show specific page and hide other
 *
 */

timesliderJS.showPage = function(parentNode, n)
{

    /* Get all »div« */
    var nodes = Array.prototype.filter.call(parentNode.children, function(node)
        {
            return node && node.matches ? node.matches('div') : false;
        });
    var scroll_before = 0;
    var scroll_next = 0;

    for(var i = 0; i < nodes.length; i++)
    {
        if(i == n)
        {
            nodes[i].classList.remove('hidden');
        }
        else
        {
            nodes[i].classList.add('hidden');
        }
        if((n > 0) && (i == (n - 1)))
        {
            scroll_before = nodes[i].dataset.scroll;
        }
        else if((n < (nodes.length - 1)) && (i == (n + 1)))
        {
            scroll_next = nodes[i].dataset.scroll;
        }
    }

    /* Get pagination */
    var pagination_buttons = parentNode.parentNode.getElementsByClassName('pagination')[0].getElementsByClassName('button');

    pagination_buttons[0].classList.add('active');
    pagination_buttons[1].classList.add('active');
    pagination_buttons[0].onclick = function(){ timesliderJS.showPage(parentNode, (n - 1)); timesliderJS.scroll(parentNode, scroll_before); };
    pagination_buttons[1].onclick = function(){ timesliderJS.showPage(parentNode, (n + 1)); timesliderJS.scroll(parentNode, scroll_next); };

    if(n < 1)
    {
        pagination_buttons[0].classList.remove('active');
        pagination_buttons[0].onclick = "";
    }
    if(n >= (nodes.length - 1))
    {
        pagination_buttons[1].classList.remove('active');
        pagination_buttons[1].onclick = "";
    }
};


/*
 * scroll()
 *
 * Param:  Node, int
 * Return: void
 *
 * This functions scrolls to a specific event
 *
 */

timesliderJS.scroll = function(parentNode, target)
{
    var timesliderbox = parentNode.parentNode.getElementsByClassName('timesliderbox')[0];
    var scroll_interval = (target - 4 - timesliderbox.scrollLeft)/30;

    (function(){
        var interval_counter = 0;
        var interval = setInterval(function()
        {
            if(interval_counter == 30)
            {
                clearInterval(interval);
                timesliderbox.scrollLeft = target - 4;
            }
            else
            {
                timesliderbox.scrollLeft += scroll_interval;
                interval_counter++;
            }
        },10)
    })();
};


timesliderJS.fullscreen = function(node)
{
    if(((typeof document.fullscreenElement !== 'undefined') && (document.fullscreenElement == null)) || ((typeof document.webkitFullscreenElement !== 'undefined') && (document.webkitFullscreenElement == null)) || ((typeof document.mozFullScreenElement !== 'undefined') && (document.mozFullScreenElement == null)))
    {
        if(typeof node.requestFullScreen !== 'undefined')
        {
            node.requestFullScreen();
        }
        else if(typeof node.webkitRequestFullScreen !== 'undefined')
        {
            node.webkitRequestFullScreen();
        }
        else if(typeof node.mozRequestFullScreen !== 'undefined')
        {
            node.mozRequestFullScreen();
        }
    }
    else
    {
        if(typeof document.cancelFullScreen !== 'undefined')
        {
            document.exitFullscreen();
        }
        else if(typeof document.webkitCancelFullScreen !== 'undefined')
        {
            document.webkitCancelFullScreen();
        }
        else if(typeof document.mozCancelFullScreen !== 'undefined')
        {
            document.mozCancelFullScreen();
        }
    }
}


/*
 * createtimesliderBox()
 *
 * Param:  Node
 * Return: void
 *
 * Build visual timeslider at the beginning
 *
 */

timesliderJS.createtimesliderBox = function(parentNode)
{
    /* Move content of timeslider to infobox */
    var tmp_infobox = parentNode.innerHTML;
    parentNode.innerHTML = '';
    parentNode.insertAdjacentHTML('afterbegin', '<div class="hints"><span>Bewegen Sie die Zeitleiste nach links und rechts</span> – <span class="fullscreen">Vollbild</span></div><div class="timesliderbox"></div><div class="infobox">' + tmp_infobox + '</div><div class="pagination active"><div class="button"><i>b</i>Voherige</div><div>Zeitleiste</div><div class="button">Nächste<i class="after">n</i></div></div>');

    /* Get all dates and titles */
    parentNode.getElementsByClassName('fullscreen')[0].onclick = function(){ timesliderJS.fullscreen(parentNode); };
    const timeslider_infobox = parentNode.getElementsByClassName('infobox')[0];
    var timeslider_headlines = timeslider_infobox.getElementsByTagName('h3');
    var timeslider_content = [];
    var timeslider_info = {first: undefined, last: undefined, current: undefined, n_cols: 0};

    /* Validate special modes */
    timeslider_info.zoom = (parentNode.dataset.zoom > 0 ? parentNode.dataset.zoom : 1);
    timeslider_info.interval = (/^(year|month|day|hour|minute|second|millisecond)$/.test(parentNode.dataset.interval) ? parentNode.dataset.interval : 'year');
    timeslider_info.mode = (/^(date|time|datetime)$/.test(parentNode.dataset.mode) ? parentNode.dataset.mode : 'date');

    for(var i = 0; i < timeslider_headlines.length; i++)
    {
        var tmp_date = timeslider_headlines[i].getElementsByTagName('span')[0].textContent;
        timeslider_content.push({date: timesliderJS.parseDate(tmp_date, timeslider_info),
                               title: timeslider_headlines[i].innerHTML.trim(),
                               n: i});
    }

    /* Get timesliderBox */
    var timeslider_box = parentNode.getElementsByClassName('timesliderbox')[0];

    /* Set first date as current */
    timeslider_info.current = timeslider_info.first.clone();

    /* Create date interval */
    var row = document.createElement('div');
    row.classList.add('timesliderrow');
    do
    {
        var col = document.createElement('span');
        if((timeslider_info.mode == 'date') || (timeslider_info.mode == 'datetime'))
        {
            switch(timeslider_info.interval)
            {
                case 'year':
                    col.innerHTML = timeslider_info.current.year();
                    break;
                case 'month':
                    col.innerHTML = timesliderJS.shortMonth(timesliderJS.MonthDE[timeslider_info.current.month()]) + '<br>' + timeslider_info.current.year();
                    break;
                default:
                    col.innerHTML = timeslider_info.current.date() + '. ' + timesliderJS.shortMonth(timesliderJS.MonthDE[timeslider_info.current.month()]) + '<br>' + timeslider_info.current.year();
                    break;
            }
        }

        if((timeslider_info.mode == 'time') || (timeslider_info.mode == 'datetime'))
        {
            switch(timeslider_info.interval)
            {
                case 'hour':
                    col.innerHTML += '<br>' + timeslider_info.current.format('HH');
                    break;
                case 'minute':
                    col.innerHTML += '<br>' + timeslider_info.current.format('HH:mm');
                    break;
                case 'second':
                    col.innerHTML += '<br>' + timeslider_info.current.format('HH:mm:ss');
                    break;
                case 'millisecond':
                    col.innerHTML += '<br>' + timeslider_info.current.format('mm:ss.SSS');
                    break;
            }
        }

        if(timeslider_info.mode == 'datetime')
        {
            col.innerHTML += ' Uhr';
        }

        /* Set current to next interval */
        timeslider_info.current.add(timeslider_info.zoom, timeslider_info.interval);

        /* Increase column counter */
        timeslider_info.n_cols++;

        /* Add col to row */
        row.appendChild(col);
    }
    while(timeslider_info.current.isSameOrBefore(timeslider_info.last));

    /* Add row to timeslider */
    timeslider_box.appendChild(row);

    // row.style.width = (timeslider_info.n_cols * ((-4 * timeslider_info.n_cols) / (timeslider_info.n_cols + 20) + 9) + 4) + "em";

    /* Variables to store values for next round */
    // var tmp_timeslider_content = [];

    /* Management variable */
    var timeslider_allocation = [];

    while(timeslider_content.length > 0)
    {
        const timeslider_event = {
            content: timeslider_content.shift(),
            begin: null,
            end: null,
            row: null
        }
        timeslider_event.begin = timeslider_event.content.date[0].diff(timeslider_info.first, timeslider_info.interval);
        timeslider_event.end   = (timeslider_event.content.date[1] !== undefined ? timeslider_event.content.date[1].diff(timeslider_info.first, timeslider_info.interval) : timeslider_event.begin);

        for(var i = 0; i < timeslider_allocation.length; i++)
        {
            for(var j = 0; j < timeslider_allocation[i].length; j++)
            {
                if((timeslider_event.begin > timeslider_allocation[i][j][1]) || (timeslider_event.end < timeslider_allocation[i][j][0]))
                {
                    timeslider_event.row = i;
                }
                else
                {
                    timeslider_event.row = null;
                }
            }
            if(timeslider_event.row != null)
            {
                break;
            }
        }

        /* In case of no position, create a new row */
        if(timeslider_event.row == null)
        {
            timeslider_allocation.push( [[timeslider_event.begin, timeslider_event.end]] );
            timeslider_event.row = timeslider_allocation.length - 1;

            /* Init new row */
            var row = document.createElement('div');
            row.classList.add('timesliderrow');
            timeslider_box.insertBefore(row, timeslider_box.childNodes[0]);
        }
        else
        {
            timeslider_allocation[timeslider_event.row].push( [timeslider_event.begin, timeslider_event.end] );
        }

        var event_box = document.createElement('div');
        var current_row = timeslider_box.childNodes[timeslider_allocation.length - timeslider_event.row - 1];
        var width_factor = 3;
        if((timeslider_info.interval == 'second') || (timeslider_info.interval == 'millisecond'))
        {
            width_factor = 5;
        }

        event_box.innerHTML = timeslider_event.content.title;
        event_box.style.left = ((timeslider_event.begin * width_factor) / timeslider_info.zoom) + 'rem';


        event_box.style.width = 'calc(' + (((timeslider_event.end - timeslider_event.begin + 1) * width_factor) / timeslider_info.zoom) + 'rem - 4pt - .4rem)';
        event_box.classList.add("color" + (timeslider_event.content.n % 5 + 1));
        event_box.onclick = function(){timesliderJS.showPage(timeslider_infobox, timeslider_event.content.n);};
        current_row.appendChild(event_box);
        timeslider_headlines[timeslider_event.content.n].parentNode.dataset.scroll = event_box.offsetLeft;
        if(current_row.offsetHeight < event_box.offsetHeight)
        {
            current_row.style.height = event_box.offsetHeight + 'px';
        }
    }

    // automatic resize, when visibility changes
    try {
        var options = {
            root: document.body,
            rootMargin: '0px',
            threshold: 1.0
        }
        var observer = new IntersectionObserver(function(entries, observer) {
            for(var i=0; i<entries.length; i++) {
                var entry = entries[i];
                if(entry.isIntersecting) {
                    timesliderJS.resizeTimesliderBox(entry.target);
                }
            }
        }, options);
        observer.observe(timeslider_box);
    } catch(e) {
        // ignore errors, this fix will not work when IntersectionObserver
        // is not implemented
    }
}

timesliderJS.resizeAllTimesliderBoxes = function() {
    var boxes = document.getElementsByClassName("timeslider");
    for(var i=0; i < boxes.length; i++) {
        timesliderJS.resizeTimesliderBox(boxes[i]);
    }
}

timesliderJS.resizeTimesliderBox = function(box) {
    var rows = box.getElementsByClassName("timesliderrow");
    for(var i=0; i < rows.length; i++) {
        var row = rows[i];

        var max_height = 0;

        var event_boxes = row.children;
        for(var j=0; j < event_boxes.length; j++) {
            var event_box = event_boxes[i];
            if(event_box.tagName === "DIV" && event_box.offsetHeight > max_height) {
                max_height = event_box.offsetHeight;
            }
        }

        if(max_height > 0) {
            row.style.height = max_height + 'px';
        }
    }
}


/*
 * ready()
 *
 * Param:  void
 * Return: void
 *
 * This function executes init() if DOM is ready
 *
 */

timesliderJS.ready = function()
{
    /* Test content of »readyState« until 5 of 5 stages completed */
    /complete/.test(document.readyState) ? timesliderJS.init() : setTimeout('timesliderJS.ready()', 10)
};

/* Call this function */
timesliderJS.ready();


/*
 * init()
 *
 * Param:  void
 * Return: void
 *
 * Initialize timeslider
 *
 */

timesliderJS.init = function()
{
    /* Get all timesliders and iterate through them */
    var timesliders = document.getElementsByClassName('timeslider');
    for(var i = 0; i < timesliders.length; i++)
    {
        timesliderJS.createtimesliderBox(timesliders[i]);
        timesliderJS.showPage(timesliders[i].getElementsByClassName('infobox')[0], 0);
    }
}
