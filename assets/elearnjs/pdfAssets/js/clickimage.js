/*
 * clickimage.js
 *
 * Author:  Lars Thoms <lars.thoms@spacecafe.org>
 * Version: 2016-04-25
 *
 * This script is part of the clickImage.js-addon of eLearn.js
 * clickImage.js used vanilla javascript and handles toggling of tasks,
 * positioning of pins and pagination.
 * All tasks and hints are visible without javascript, but without pins.
 *
 */


/* ====[ Code ]============================================================== */

/*
 * clickimageToggle()
 *
 * Param:  Node, int
 * Return: void
 *
 * Toggle »pininfo« and active pin.
 * If »pin_number« is »0« all tasks will be hidden.
 * If »pin_number« is »-1« all tasks will be shown.
 * Otherwise a specific »div« in »pininfo« will be shown up
 * and clicked pin will set to active.
 *
 */

function clickimageToggle(element, pin_number)
{
    /* Get »pininfo«-node */
    var parent_node = element.getElementsByClassName('pininfo')[0];

    /* Get all »div« */
    var child_nodes = Array.prototype.filter.call(parent_node.children, function(node)
        {
            // FIXED FOR PHANTOM.JS
            return node && node.matches ? node.matches('div') : false;
        });

    /* Counts pins to determine current pin */
    var pin_counter = 1;

    /* State of »pininfo« */
    var clickimage_showall = false;

    /* Iterate through all »div« */
    for(var i = 0; i < child_nodes.length; i++)
    {
        var child_node = child_nodes[i];

        /* Show all »pininfo-div« */
        if(pin_number == -1)
        {
            child_node.classList.remove('inactive');
            clickimage_showall = true;
        }

        /* Hide all »pininfo-div« */
        else if(pin_number == 0)
        {
            child_node.classList.add('inactive');
        }
        /* Show »pininfo-div« refering to clicked pin */
        else if(pin_number == pin_counter)
        {
            child_node.classList.remove('inactive');

            /* Activate buzzer */
            element.getElementsByClassName('buzzer')[0].classList.add('active');
        }

        /* Hide all »pininfo-div« if pin */
        else
        {
            child_node.classList.add('inactive');
        }
        pin_counter++;
    }

    /* Set text of »infobox-button« */
    var infobox_button = element.getElementsByClassName('infobox')[0].getElementsByClassName('button')[0];
    infobox_button.innerHTML = (clickimage_showall ? '<i class="mirrorY">c</i>Alle verstecken' : '<i>c</i>Alle anzeigen');
    infobox_button.setAttribute('onclick', 'clickimageToggle(this.parentNode.parentNode.parentNode, ' + (clickimage_showall ? 0 : -1 ) + ')');

    /* Get pin-nodes */
    var pins = element.getElementsByClassName('pins')[0].getElementsByTagName('li');

    /* Pagination */
    var pagination = element.getElementsByClassName('pagination')[0];
    var pagination_buttons = pagination.getElementsByClassName('button');
    moo = pagination_buttons;
    pagination_buttons[0].setAttribute('onclick', 'clickimageToggle(this.parentNode.parentNode, ' + (pin_number - 1) + ')');
    pagination_buttons[2].setAttribute('onclick', 'clickimageToggle(this.parentNode.parentNode, ' + (pin_number + 1) + ')');
    pagination_buttons[0].classList.add('active');
    pagination_buttons[2].classList.add('active');

    /* Hide pagination if pin-limit is reached */
    if(pin_number < 1)
    {
        pagination.classList.remove('active');
    }
    else
    {
        if(pin_number < 2)
        {
            pagination_buttons[0].classList.remove('active');
            pagination_buttons[0].removeAttribute('onclick');
        }
        else if(pin_number >= pins.length)
        {
            pagination_buttons[2].classList.remove('active');
            pagination_buttons[2].removeAttribute('onclick');
        }
        pagination.classList.add('active');
    }

    /* Iterate through all pins and set clicked to active */
    for(var i = 0; i < pins.length; i++)
    {
        var pin = pins.item(i);
        if(pin_number == (i+1))
        {
            pin.classList.add('active');
            pin.classList.add('visited');
        }
        else
        {
            pin.classList.remove('active');
        }
    }

    /* Hide buzzer aufter 0.5s */
    setTimeout(function()
    {
        element.getElementsByClassName('buzzer')[0].classList.remove('active');
    }, 250);
}


/*
 * clickimagePins()
 *
 * Param:  Node, int[]
 * Return: void
 *
 * Put clickable pins over of image.
 * Format of parameter »coordinates«:
 *   [[x,y],[x,y],...]
 *   Values: 0-100 (percent) of image width/height
 *
 *   Ex.: [[30,30],[80,60],[66,10]]
 *          Pin 1   Pin 2   Pin 3
 */

function clickimagePins(element, coordinates)
{

    /* Counts pins to determine current pin */
    var pin_counter = 1;

    /* Create list of pins */
    var pin_list = document.createElement('ol');
    pin_list.classList.add('pins');
    element.parentNode.appendChild(pin_list);

    /* Add »infobox« to »imagebox« */
    element.parentNode.parentNode.insertAdjacentHTML('afterbegin', '<div class="infobox"><div><i>v</i>Bitte klicken Sie auf die Punkte.</div><div class="button" onclick="clickimageToggle(this.parentNode.parentNode.parentNode, 0)"></div></div>');

    /* Iterate through the array of coordinates */
    coordinates.forEach(function(coordinate)
    {
        var pin = document.createElement('li');
        if(coordinate[2] != undefined)
        {
            pin.classList.add(coordinate[2]);
        }
        pin.insertAdjacentHTML('afterbegin', '<i>o</i><span>' + pin_counter + '</span>');
        pin.setAttribute('style', 'top:calc(' + coordinate[1] + '% - 0.5em);left:calc(' + coordinate[0] + '% - 0.5em);');
        pin.setAttribute('onclick', 'clickimageToggle(this.parentNode.parentNode.parentNode, ' + pin_counter + ')');
        pin_list.appendChild(pin);
        pin_counter++;
    });

    /* Add buzzer */
    element.parentNode.insertAdjacentHTML('beforeend', '<ul class="buzzer"><li>1</li><li>1</li><li>1</li></ul>');

    /* Add »pagination« */
    element.parentNode.parentNode.insertAdjacentHTML('beforeend', '<div class="pagination"><div class="button"><i>b</i>Voherige</div><div class="button active" onclick="clickimageToggle(this.parentNode.parentNode,0)">Schließen</div><div class="button">Nächste<i class="after">n</i></div></div>');

    /* Hide all »pininfo« */
    clickimageToggle(element.parentNode.parentNode, 0);
}
