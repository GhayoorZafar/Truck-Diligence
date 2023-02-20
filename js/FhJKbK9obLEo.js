var mylocation = "blank";
var is_keyboard = false;
var is_landscape = false;
var initial_screen_size = window.innerHeight;

/* Android */
window.addEventListener("resize", function() {
    is_keyboard = (window.innerHeight < initial_screen_size);
    is_landscape = (screen.height < screen.width);
    updateViews();
}, false);

/* iOS */
$("input:not(.input)").on("focus blur", function() {
    $(window).scrollTop(10);
    is_keyboard = $(window).scrollTop() > 0;
    $(window).scrollTop(0);
    is_landscape = (screen.height < screen.width);
    updateViews();
});

function updateViews() {
    //  if(is_keyboard) { $('.select2-dropdown').addClass('select2-dropdown-fullscreen');  }
    //  else { $('.select2-dropdown-fullscreen').removeClass('select2-dropdown-fullscreen'); }
}


//Highlight text being typed
function markMatch(text, term) {
    var match = text.toUpperCase().indexOf(term.toUpperCase());
    var $result = $('<span></span>');
    if (match < 0) {
        return $result.text(text);
    }
    $result.text(text.substring(0, match));
    var $match = $('<span class="select2-rendered__match"></span>');
    $match.text(text.substring(match, match + term.length));
    $result.append($match);
    $result.append(text.substring(match + term.length));
    return $result;
}


//If a state is selected, just return states.
function states_currently_selected(me) {
    if (me.find("option:selected").length > 0 && me.val()[0].length == 2) {
        return 1;
    }
    return 0;
}

function select2_templateResult(item, obj, skip_label) {
    if (item.loading) {
        return item.text;
    } // No need to template the searching text
    var result;
    if (item.id == "usegps") { //use gps not geoip
        result = "<span style='white-space:nowrap'><img style='width:22px;height:22px' src='" +
            dfBaseURL + "/images/crosshair-small.png'>&nbsp;Use My Current Location</span>";
    } else if (item.id.length == 2) { //state/country/province
        result = "<span style='white-space:nowrap'>&nbsp;" + item.id + "&nbsp;-&nbsp;" + item.region_name;
        if (!skip_label) result += "&nbsp;(entire&nbsp;" + item.record_type + ")";
        result += "</span>";
    } else if (item.id.indexOf(',') > -1) { //city
        result = "<span style='white-space:nowrap'>&nbsp;" + item.id + "&nbsp;" + item.postal_code;
        if (!skip_label) result += "&nbsp;(radius search)";
        result += "</span>";
    } else {
        result = "<span style='white-space:nowrap'>" + item.text + '</span>';
    }
    var searchterm = query.term || '';
    //var $result2 = markMatch(item.text, searchterm); 
    return $(result);
}

//Help sort ajax results
var select2_Sorter = function(data) {
    return data.sort(function(a, b) {
        if (parseInt(a.leven) < parseInt(b.leven)) {
            return 1;
        }
        if (parseInt(a.leven) > parseInt(b.leven)) {
            return -1;
        }
        if (parseInt(a.zipcount) < parseInt(b.zipcount)) {
            return 1;
        }
        if (parseInt(a.zipcount) > parseInt(b.zipcount)) {
            return -1;
        }
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; //alphabetically last
    });
};

function select2_Transport(params, success, failure, obj) {
    if (!obj.data('select2').isOpen()) {
        return null;
    }
    success(); //load default options first
    var $request = $.ajax(params);
    $request.then(success);
    $request.fail(failure);
    return $request;
};

function select2_SelectionLength(obj) {
    var val = obj.val();
    if (val === null) return 10;
    val = val.join(':');
    if (val.indexOf(",") > -1 || val.match(/[a-z][a-z][a-z]/i)) return 1; //it's a city
    return 10;
}

function select2_processResults(data, query, obj, geoip_city, geoip_statecode, geoip_statename, geoip_countrycode, just_city) {

    var usegps = {
        id: 'usegps',
        text: "Request Location",
        zipcount: '5000',
        leven: '30097',
    };

    var blankspot = {
        id: 'blankline',
        text: "", //need a space for defined
        zipcount: '5000',
        leven: '30098',
        disabled: false
    };

    var topitems = [{
        id: 'textmessage',
        text: (just_city == 1) ? "You may select 1 city" : "You may select 1 city or up to 10 states",
        zipcount: '5000',
        leven: '30099',
        disabled: true
    }, ];

    var topitems2 = topitems.slice(0); //clone it
    topitems.push(blankspot);

    if (!states_currently_selected(obj)) {
        topitems.push(usegps);
    }

    if (geoip_statecode.length > 1 && geoip_statecode.indexOf("undef") == -1) {

        if (geoip_city.length > 1 && geoip_city.indexOf("undef") == -1 && !states_currently_selected(obj)) {
            var geoip_city2 = {
                id: geoip_city + ", " + geoip_statecode,
                text: geoip_city + ", " + geoip_statecode,
                region_name: geoip_statename || geoip_statecode,
                record_type: (geoip_countrycode == 'CA' ? 'province' : 'state'),
                zipcount: '5000',
                leven: '30096',
            };
            topitems.push(geoip_city2);
        }
        if (!just_city) {
            var geoip_state2 = {
                id: geoip_statecode,
                text: geoip_statecode,
                region_name: geoip_statename || geoip_statecode,
                record_type: (geoip_countrycode == 'CA' ? 'province' : 'state'),
                zipcount: '5000',
                leven: '30095',
            };
            topitems.push(geoip_state2);
        }
    }

    var moreresults = {
        id: 'moreresults',
        text: "Loading more results...",
        zipcount: '5000',
        leven: '0',
        disabled: true,
    }

    //The next portion causes an extra selection on Android if virtual keyboard is open while a selection is made
    if (data && !obj.data('select2').isOpen() && query.term.length > 1) //this is for people who tab too fast.
    {
        var already_exists = ($.inArray(data[0].id, obj.val())) > -1;
        //if(!already_exists && select2_SelectionLength(obj) != 1) {
        if (!already_exists) {
            var itemtoadd = data[0].id || (data[0].city ? data[0].city + ", " + data[0].region_code : data[0].region_code);
            var option = new Option(itemtoadd, itemtoadd, true, true);
            obj.append(option);
            obj.trigger('change');
        }
    }

    if (!data) {
        data = topitems.concat(moreresults);
    } //no data, return the top entries.
    else if (query.term.length < 2) {
        var data = $.grep(data, function(e) {
            return (e.id != geoip_statecode && e.id != geoip_city);
        }); //purge duplicate from display
        data = topitems.concat(data); //just started typing, append the top entries
    } else {
        data = topitems2.concat(data);
    } //in the midst of typing, just append the instructions
    data = $.map(data, function(item) {
        return {
            id: item.id || (item.city ? item.city + ", " + item.region_code : item.region_code),
            text: item.text ||
                (item.city ? item.city + ", " + item.region_code :
                    (item.region_code ? item.region_code : item.text) //if not a city or a state, just return the original which is likely empty string at this point.
                ),
            region_name: item.region_name,
            record_type: item.record_type,
            postal_code: item.postal_code || "",
            leven: item.leven || 0,
            zipcount: item.zipcount || 0,
            disabled: item.disabled || false
        }
    });
    
    return {
        results: data,
        pagination: {
            more: false
        }
    };
}

function select2_selecting(e, setlocation_callback, obj) {

    var already_exists = ($.inArray(e.params.args.data.text, obj.val())) > -1;

    if (e.params.args.data.text == "" || already_exists) {
        e.preventDefault();
    } //don't add blank options
    else if (e.params.args.data.id == "usegps" && navigator.geolocation) {
        //if(mylocation.indexOf(",") > -1) //has a comma, presumed to be a city/state already
        //        {
        //        e.params.args.data.id = mylocation;
        //        e.params.args.data.text = mylocation;
        //        }
        //else
        {
            mylocation = "Requesting Location";
            e.params.args.data.id = mylocation;
            e.params.args.data.text = mylocation;
            navigator.geolocation.getCurrentPosition(setlocation_callback, setlocation_callback, {
                timeout: 10000,
                maximumAge: 30000,
                enableHighAccuracy: false
            });
            $(obj).prop("disabled", true); //disable so keyboard hides.
            setTimeout(function() { //now reenable.
                document.body.focus(); //move focus elsewhere
                $(obj).prop("disabled", false); //reenable the widget
            }, 14);
        }
    }

}

function set_mylocation(obj) {
    var option = new Option(mylocation, mylocation, true, true);
    obj.val('').append(option).trigger('change');
}


var lat = 0;
var lon = 0;

function select2_setLocation_callback(position, obj, citystate) {

    if (position.message) {
        mylocation = position.message;
        set_mylocation(obj);
        if (lat == 0 || lon == 0) return;
    } else if (!position.coords || !position.coords.latitude || !position.coords.longitude) {
        mylocation = "Unable to find lat/lon";
        set_mylocation(obj);
        if (lat == 0 || lon == 0) return;
    } else {
        lat = position.coords.latitude;
        lon = position.coords.longitude;
    }
    mylocation = "Finding closest city to " + lat.toFixed(2) + "/" + lon.toFixed(2);
    set_mylocation(obj);
    var $request = $.ajax({
        url: (window.location.pathname.match('^/.*home/')?? '') + 'ajax/reverse_geocode',
        data: {
            latitude: lat,
            longitude: lon
        }
    });
    $request.then(function(cityname) {
        mylocation = cityname;
        set_mylocation(obj);
    });
    $request.fail(function() {
        mylocation = 'Unable to find closest city';
        //if(citystate.length > 5) { mylocation = citystate; } 
        set_mylocation(obj);
    });
}
