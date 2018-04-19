var generalConfig = {
    keepSaveLocations: {
        title: 'Keep export locations after exit',
        description: 'When exporting a file for the first time, you are prompted with an export location. When checked, this will be kept after an atom restart.',
        type: 'boolean',
        default: false,
        order: 0,
    },
    keepExportSettings: {
        title: 'Keep export option defaults after exit',
        description: 'When exporting, you might be prompted with export options. Your selected values will be stored as defaults. When checked, those defaults will be kept after an atom restart.',
        type: 'boolean',
        default: true,
        order: 10,
    },
    displayExportOptions: {
        title: 'Always display export options',
        description: 'If deactivated, export options will only prompt once.',
        type: 'boolean',
        default: true,
        order: 15,
    },
    detectExtensionsMethod: {
        title: 'Method to detect extensions',
        description: 'Method to define default values in export options. _Automatic_: scan the file for included extensions. _Last_: display last selected values.',
        type: 'string',
        default: 'auto',
        enum: [
            {value: "auto", description: "Automatic detection"},
            {value: "last", description: "Last values"},
            {value: "on", description: "Always on"},
            {value: "off", description: "Always off"},
        ],
        order: 17,
    },
    newSectionOnHeading: {
        title: 'Start a new section at headings',
        type: 'boolean',
        default: true,
        order: 20,
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
        order: 30,
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
    },
    header: {
        title: 'Custom header text',
        description: 'HTML to be set as header. For more information visit https://github.com/marcbachmann/node-html-pdf#footers-and-headers. This will be passed into the <body> directly. Make sure to use it correctly.',
        type: 'string',
        default: '',
        order: 30,
    },
    headerHeight: {
        title: 'Header height',
        description: 'Check https://github.com/marcbachmann/node-html-pdf#options for more information on supported values.',
        type: 'string',
        default: '0',
        order: 40,
    },
    footer: {
        title: 'Custom footer text',
        description: 'HTML to be set as footer. The footer dimensions are set to a height of 17mm by default. If you want to overwrite the origin footer use `<div id="pageFooter">YOUR CONTENT</div>`. For more information visit https://github.com/marcbachmann/node-html-pdf#footers-and-headers. This will be passed into the <body> directly. Make sure to use it correctly.',
        type: 'string',
        default: '',
        order: 50,
    },
    footerHeight: {
        title: 'Footer height',
        description: 'Check https://github.com/marcbachmann/node-html-pdf#options for more information on supported values.',
        type: 'string',
        default: '17mm',
        order: 60,
    },
    customStyle: {
        title: 'CSS Stylesheet',
        description: 'Absolute path to a .css stylesheet extending or overwriting the elearn.js styles. This will be loaded before the custom scripts/styles from the meta block.',
        type: 'string',
        default: '',
        order: 70,
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
