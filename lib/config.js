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

var htmlConfig = {
    sectionOrder: {
        title: 'Section Order',
        type: 'object',
        properties: {
            useSectionLevel: {
                title: 'Create section levels',
                description: 'Used by elearn.js in overview. Will sort markdown heading levels to elearn.js section levels.',
                type: 'boolean',
                default: true,
                order: 0,
            },
            sub: {
                title: 'Subsection',
                description: 'Headings with this level or lower are tagged as subsection.',
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
                order: 1,
            },
            subsub: {
                title: 'Subsubsection',
                description: 'Headings with this level or lower are tagged as subsubsection.',
                type: 'integer',
                default: 4,
                enum: [
                    {value: 1, description: 'H1 - # Heading'},
                    {value: 2, description: 'H2 - ## Heading'},
                    {value: 3, description: 'H3 - ### Heading'},
                    {value: 4, description: 'H4 - #### Heading'},
                    {value: 5, description: 'H5 - ##### Heading'},
                    {value: 6, description: 'H6 - ###### Heading'},
                ],
                order: 2,
            },
        },
        order: 0,
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
        title: 'Zoom of PDF Output',
        description: 'Value needs to be greater than zero.',
        type: 'number',
        default: 1.0,
        order: 10,
    },
    renderDelay: {
        title: 'Delay of HTML rendering in seconds',
        description: 'Might be useful for delayed scripts.',
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
    htmlConfig: {
        title: 'HTML Settings',
        type: 'object',
        properties: htmlConfig,
        order: 10,
    },
    pdfConfig: {
        title: 'PDF Settings',
        type: 'object',
        properties: pdfConfig,
        order: 20,
    },
}

module.exports = config;
