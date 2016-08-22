import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {createStore, compose, applyMiddleware} from 'redux';
import {Router, Route, hashHistory} from 'react-router';
import reduxThunk from 'redux-thunk';
import {routerMiddleware} from 'react-router-redux';

import reducer from 'reducers/reducer';
import App from 'components/App';
import Repository from 'components/Repository';
import RepositoryList from 'components/RepositoryList';

import fetchUser from 'actions/fetchUser';
import fetchRepo from 'actions/fetchRepo';
import fetchProjects from 'actions/fetchProjects';

// Which history store to use?
const history = hashHistory;

// Configure Store
let store = createStore(reducer, {}, compose(
  applyMiddleware(reduxThunk, routerMiddleware(history)),
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

// On route change, fire actions.
history.listen(event => {
  const dispatch = store.dispatch;
  const state = store.getState();
  const pathname = event.pathname;

  // fetch the user if the user hasn't been fetched already
  if (state.user === null) {
    dispatch(fetchUser());
  }
  let match;

  // /repos
  // Get a list of all repos that the user has configured.
  if (match = pathname.indexOf('/repos') === 0) {
    dispatch(fetchProjects());
  }

  // /repos/:provider/:user/:repo
  // When navigating to a new repo's page, fetch its details
  if (match = pathname.match(/^\/repos\/(github)\/(.+)\/(.+)\/?$/)) {
    dispatch(fetchRepo(match[1], match[2], match[3]));
  }
});

// Render it all.
render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={App}>
        <Route path="/repos" component={RepositoryList} />
        <Route path="/repos/:provider/:user/:repo" component={Repository} />
      </Route>
    </Router>
  </Provider>,
  document.getElementById('root')
);
