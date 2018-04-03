var generalConfig = {
    newSectionOnHeading: {
        title: 'Start a new section at headings',
        type: 'boolean',
        default: true,
        order: 0,
    },
    newSectionOnHeadingDepth: {
        title: 'New sections up to depth',
        type: 'integer',
        default: 3,
        enum: [
            {value: 1, description: 'H1 - # Heading'},
            {value: 2, description: 'H2 - ## Heading'},
            {value: 3, description: 'H3 - ### Heading'},
            {value: 4, description: 'H4 - #### Heading'},
            {value: 5, description: 'H5 - ##### Heading'},
            {value: 6, description: 'H6 - ###### Heading'},
        ],
        order: 10,
    },
};

var pdfConfig = {
    newPageOnSection: {
        title: 'Start a new page at a section start',
        type: 'boolean',
        default: true,
        order: 0,
    },
    zoom: {
        title: 'Zoom of PDF Output (> 0)',
        type: 'number',
        default: 1.0,
        order: 10,
    },
    renderDelay: {
        title: 'Delay of HTML rendering (might be useful for delayed scripts) in seconds',
        type: 'number',
        default: 0,
        order: 20,
    }
};

var config = {
    generalConfig: {
        title: 'General Settings',
        type: 'object',
        properties: generalConfig,
        order: 0,
    },
    pdfConfig: {
        title: 'PDF Settings',
        type: 'object',
        properties: pdfConfig,
        order: 10,
    },
}

module.exports = config;
