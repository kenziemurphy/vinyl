var HELP_PRESETS = {
    'minor': {
        title: 'Minor Mode',
        body: `Data points below this line represent songs that are written in a "minor scale/mode", which usually makes them sound sad or darker.`
    },
    'major': {
        title: 'Major Mode',
        body: `Data points above this line represent songs that are written in a "major scale/mode", which usually makes them sound happy or bright.` 
    },
    'key': {
        title: 'Key',
        body: `The key of a song indicates its "root" note and its "mode". Keys in <i>major mode</i> usually sound brighter while <i>minor keys</i> (denoted with an 'm' at the end) usually sound darker.` 
    },
    'key_signature': {
        title: 'Key',
        body: `The key of a song indicates its "root" note and its "mode". Keys in <i>major mode</i> usually sound brighter while <i>minor keys</i> (denoted with an 'm' at the end) usually sound darker.` 
    },
    'key_signature_by_fifths': {
        title: 'Key',
        body: `The key of a song indicates its "root" note and its "mode". Keys in <i>major mode</i> usually sound brighter while <i>minor keys</i> (denoted with an 'm' at the end) usually sound darker.` 
    },
    'key_signature_full': {
        title: 'Key',
        body: `The key of a song indicates its "root" note and its "mode". Keys in <i>major mode</i> usually sound brighter while <i>minor keys</i> (denoted with an 'm' at the end) usually sound darker.` 
    },
    'time_signature': {
        title: 'Time Signature',
        body: 'The time signature (meter) is a notational convention to specify how many beats are in each bar (or measure)'
    },
    'tempo': {
        title: 'Tempo',
        body: `Tempo is the speed or pace of a song, measured in beats per minute (BPM).` 
    },
    'acousticness': {
        title: 'Acousticness',
        body: `A confidence measure from 0 to 1 of whether the track is acoustic. 1.0 represents high confidence the track is acoustic.` 
    },
    'danceability': {
        title: 'Danceability',
        body: `Danceability describes how suitable a track is for dancing based on a combination of musical elements including tempo, rhythm stability, beat strength, and overall regularity.` 
    },
    'energy': {
        title: 'Energy',
        body: `	Energy is a measure from 0 to 1 representing intensity and activity. Typically, energetic tracks feel fast, loud, and noisy.` 
    },
    'instrumentalness': {
        title: 'Instrumentalness',
        body: `	Predicts whether a track contains no vocals. “Ooh” and “aah” sounds are treated as instrumental in this context.`
    },
    'liveness': {
        title: 'Liveness',
        body: `	Detects the presence of an audience in the recording. Higher liveness values represent an increased probability that the track was performed live.` 
    },
    'loudness': {
        title: 'Loudness',
        body: `The overall loudness of a track in decibels (dB).` 
    },
    'speechiness': {
        title: 'Speechiness',
        body: `	Speechiness detects the presence of spoken words in a track. The more exclusively speech-like the recording (e.g. talk show, audio book, poetry), the closer to 1.0 the attribute value.` 
    },
    'valence': {
        title: 'Musical Positivity (aka. Valence)',
        body: `A measure from 0.0 to 1.0 describing the musical positiveness conveyed by a track. Tracks with high valence sound more positive (e.g. happy, cheerful, euphoric), while tracks with low valence sound more negative (e.g. sad, depressed, angry).`
    },
    'popularity': {
        title: 'Popularity',
        body: 'A measure from 0 to 100 calculated by Spotify\'s algorithm which signifies how much the track has been played and how recent the plays are.'
    },
    'split-view': {
        title: 'Split View',
        body: 'Only available when two or more artists are loaded.'
    },
    'mode-pca': {
        title: 'Group by Similarity',
        body: 'When on, this mode will try to move songs that are <i>generally</i> similar to each other closer together. The x and y axes would not have a particular meaning. This cluster view was created using "Principle Component Analysis" (PCA) projection technique.'
    },
    'mode-value': {
        title: 'Plot by Attribute Values',
        body: 'When on, this mode will position each data point on axes by the selected attributes (e.g., key, tempo, energy, etc.).'
    }
};

function addHelpTooltip (helpContent) {
    if (typeof helpContent == 'string') {
        let helpContentKey = helpContent
        helpContent = HELP_PRESETS[helpContentKey];
        if (helpContent === undefined) {
            helpContent = {
                title: Utils.formatKeyLabel(helpContentKey),
                body: ''
            }
        }
        // console.log("addHelp", helpContent);
    }

    var onCall = function (context) {
        let selection = context.selection ? context.selection() : context;
        // console.log(selection);
        if (selection.node().tagName == 'text') {
            selection = selection.append('tspan')
                .html(' &#xf059;')
                .style('font-family', 'FontAwesome')
                .attr('alignment-baseline', 'inherit')
        } else {
            selection = selection.append('i')
                .attr('class', 'far fa-question-circle')
        }
        selection
            .classed('help', true)
            .datum(function () {
                return {
                    helpTitle: helpContent.title,
                    helpBody: helpContent.body
                }
            })
            .on('mouseover', function (d) {
                
                let tooltip = d3.select('.help-tooltip')
        
                tooltip.select('.help-title')
                .html(d.helpTitle)
                tooltip.select('.help-body')
                .html(d.helpBody)
                
                tooltip.classed('hide', false)
                    .style('left', function () {
                        if (d3.event.pageX + this.clientWidth > document.body.clientWidth)
                            return 'auto';
                        else if (d3.event.pageX - this.clientWidth / 2 <= 0)
                            return this.clientWidth / 2 + 'px';
                        else
                            return d3.event.pageX + 'px';
                    })
                    .style('right', function () {
                        if (d3.event.pageX + this.clientWidth > document.body.clientWidth)
                            return -this.clientWidth / 2 + 'px';
                        else
                            return 'auto';
                    })
                    .style('top', function () {
                        if (d3.event.pageY + this.clientHeight > document.body.clientHeight)
                            return 'auto';
                        else
                            return d3.event.pageY + 'px';
                    })
                    .style('bottom', function () {
                        if (d3.event.pageY + this.clientHeight > document.body.clientHeight)
                            return '15px';
                        else
                            return 'auto';
                    })
            })
            .on('mouseout', function (d) {
                d3.select('.help-tooltip')
                    .classed('hide', true)
            });
        // console.log('!', selection, helpContent.title)
    }

    return onCall;
}

d3.selectAll(".add-help")
    .each(function (d, i, m) {
        if (d3.select(m[i]).attr('data-help-key')) {
            return addHelpTooltip(HELP_PRESETS[d3.select(m[i]).attr('data-help-key')])(d3.select(m[i]));
        } else {
            return addHelpTooltip({
                title: d3.select(m[i]).attr('data-help-title'),
                body: d3.select(m[i]).attr('data-help-body')
            })(d3.select(m[i]));
        }
    });