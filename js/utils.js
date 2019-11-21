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