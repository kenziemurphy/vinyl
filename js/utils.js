window.Utils = {
    FORMAT_FOR_KEY: {
        'release_year': d3.format('d'),
        'popularity': d3.format('d'),
        'time_signature': d3.format('d'),
        'duration': (d) => d3.timeFormat('%M:%S')( new Date(0).setSeconds(d) )
    },
    formatByKey: function (key) {
        return this.FORMAT_FOR_KEY[key] || function (value) {
            if (typeof value == 'number')
                return d3.format('.1f')(value);
            else
                return value;
        }
    },
    KEY_LABEL: {
        "tempo": "Tempo (BPM)",
        "loudness": "Loudness (dB)",
        "duration": "Duration (min)",
        "key_signature": "Key",
        "key_signature_by_fifths": "Key",
        "valence": "Positiveness"
    },
    snakeToCap (s) {
        return s.split('_').map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(' ');
    },
    formatKeyLabel: function (key) {
        return this.KEY_LABEL[key] || this.snakeToCap(key)
    },

    euclidianDistance: function(a, b) {
        return Math.sqrt(Math.pow(a["energy"] - b["energy"], 2)
            + Math.pow(a["instrumentalness"] - b["instrumentalness"], 2)
            + Math.pow(a["acousticness"] - b["acousticness"], 2)
            + Math.pow(a["valence"] - b["valence"], 2)
            + Math.pow(a["danceability"] - b["danceability"], 2)
            + Math.pow(a["liveness"] - b["liveness"], 2)
            + Math.pow(a["speechiness"] - b["speechiness"], 2));
    }
}

function arrayJoin (a, b, key) {
    var bKeys = b.map(y => y[key]);
    var abJoined = a.map(function (x) {
        var bIndex = bKeys.indexOf(x[key])
        if (bIndex >= 0) {
            return {...x, ...b[bIndex]};
        } else {
            return false;
        }
    });

    return abJoined.filter(x => x !== false);
}

function arrayOuterJoin (a, b, key) {
    let aIds = a.map(d => d.id);
    let bIds = b.map(d => d.id);
    let aOutsideB = a.filter(n => !bIds.includes(n.id));
    let bOutsideA = b.filter(n => !aIds.includes(n.id));

    return arrayJoin(a, b, key).concat(aOutsideB).concat(bOutsideA);
}

function arrayMerge (a, b, key) {
    let aIds = a.map(d => d.id);
    let bIds = b.map(d => d.id);
    let aOutsideB = a.filter(n => !bIds.includes(n.id));
    let bOutsideA = b.filter(n => !aIds.includes(n.id));

    return arrayJoin(a, b, key).filter(n => bIds.includes(n.id)).concat(bOutsideA);
}

function selectAllOrCreateIfNotExist (d3selection, selector) {
    var s = selector;
    var elem = '';
    var classes = [];
    var ids = [];

    function regexIndexOf (s, regex, startpos = 0) {
        var indexOf = s.substring(startpos).search(regex);
        return (indexOf >= 0) ? (indexOf + startpos) : indexOf;
    }
    
    let i = regexIndexOf(s, /[\.#]/);
    if (i >= 0) {
        elem = s.substring(0, i);
        s = s.substring(i);
        while (s.length > 0) {
            let i = regexIndexOf(s, /[\.#]/, 1);
            if (i < 0)
                i = s.length;
    
            let candidate = s.substring(0, i);
            if (candidate[0] == '.') {
                classes.push(candidate.substring(1));
            }
            if (candidate[0] == '#') {
                ids.push(candidate.substring(1));
            }
            s = s.substring(i);
        }
    } else {
        elem = s;
    }

    var sel = d3selection.selectAll(selector)
    if (sel.size() <= 0) {
        sel = d3selection.append(elem)
            .attr('id', ids.join(' '))
            .attr('class', classes.join(' '));
    }
    return sel;
}

/**
 * @desc round number to a certain decimal points
 * @param float value - the number to be rounded
 * @param int decimal - number of desired decimal points
 * @return float - rounded number
*/
function round (value, decimals) {
    if (typeof value == 'number')
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    else
        return value;
}


