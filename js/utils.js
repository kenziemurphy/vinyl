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