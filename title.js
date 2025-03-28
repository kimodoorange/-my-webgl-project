// Mount the Random Text Resolver
document.addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(
        React.createElement(RandomTextResolver),
        document.getElementById('title-container')
    );
});