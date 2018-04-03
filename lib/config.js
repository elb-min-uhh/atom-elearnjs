var config = {
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
        ]
    }
}

module.exports = config;
