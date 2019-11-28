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
        body: `The key of a song indicates its "root" note.` 
    },
    'key_signature': {
        title: 'Key',
        body: `The key of a song indicates its "root" note.` 
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
        title: 'Valence',
        body: `A measure from 0.0 to 1.0 describing the musical positiveness conveyed by a track. Tracks with high valence sound more positive (e.g. happy, cheerful, euphoric), while tracks with low valence sound more negative (e.g. sad, depressed, angry).`
    }
};

function addHelpTooltip (helpContent) {
    if (typeof helpContent == 'string') {
        let helpContentKey = helpContent
        helpContent = HELP_PRESETS[helpContentKey];
        if (helpContent === undefined) {
            helpContent = {
                title: helpContentKey,
                body: ''
            }
        }
    }

    var onCall = function (context) {
        let selection = context.selection ? context.selection() : context;
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
            .attr('class', 'help')
            .datum(function () {
                return {
                    helpTitle: helpContent.title,
                    helpBody: helpContent.body
                }
            })
            .on('mouseover', function (d) {
                console.log('!!')
                let tooltip = d3.select('.help-tooltip')
                    .classed('hide', false)
                    .style('left', d3.event.pageX + 'px')
                    .style('top', d3.event.pageY + 'px')
                    tooltip.select('.help-title')
                    .text(d.helpTitle)
                    tooltip.select('.help-body')
                    .text(d.helpBody)
                })
            .on('mouseout', function (d) {
                d3.select('.help-tooltip')
                    .classed('hide', true)
            });
    }

    return onCall;
}

d3.selectAll(".help")
    .datum(function () {
        return {
            helpTitle: this.getAttribute("data-help-title"),
            helpBody: this.getAttribute("data-help-body")
        }
    })
    .on('mouseover', function (d) {
        console.log('!!')
        let tooltip = d3.select('.help-tooltip')
            .classed('hide', false)
            .style('left', d3.event.pageX + 'px')
            .style('top', d3.event.pageY + 'px')
            tooltip.select('.help-title')
            .text(d.helpTitle)
            tooltip.select('.help-body')
            .text(d.helpBody)
        })
    .on('mouseout', function (d) {
        d3.select('.help-tooltip')
            .classed('hide', true)
    });
