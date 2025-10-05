const preview = {
    parameters: {
        layout: "centered",
    },

    decorators: [
        (story) => ({
            components: { story },
            template: `
                <div style="padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
                    <story />
                </div>
            `
        })
    ]
};

export default preview;