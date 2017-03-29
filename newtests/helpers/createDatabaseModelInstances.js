import faker from 'faker';
import {Schema} from 'jugglingdb';
import Promise from 'bluebird';

import linkBuilder from '../../src/models/Link';
import userBuilder from '../../src/models/User';
import repositoryBuilder from '../../src/models/Repository';

const schema = new Schema('memory');
const User = userBuilder(schema);
const Repository = repositoryBuilder(schema);
const Link = linkBuilder(schema);

// A class to abstract away makind database models in tests. I'm abstrating this away because if the
// database model ever changes (READ: fields added), I want all my tests to continue to work.
export default class DatabaseTransation {
  constructor() {
    this.Link = Link;
    this.Repository = Repository;
    this.User = User;
  }

  reset() {
    return Promise.all([
      this.Link.destroyAll(),
      this.User.destroyAll(),
      this.Repository.destroyAll(),
    ]);
  }

  makeUser({username, email}={}) {
    username = username || faker.internet.userName();
    return this.User.create({
      username,
      email: email || faker.internet.email(),
      picture: faker.image.imageUrl(),
      providerId: faker.random.number(),
      accessToken: faker.random.uuid().replace(/-/, ''),
    });
  }

  makeRepository(type, {owner, repo, fork, branches, branch}={}) {
    if (type === 'fork-all') {
      return this.Repository.create({
        type: 'fork-all',
      });
    } else if (type === 'repo') {
      owner = owner || faker.internet.userName();
      repo = repo || faker.random.word();
      fork = fork || false;
      branch = branch || faker.random.word();
      return this.Repository.create({
        type: 'repo',
        owner,
        repo,
        fork,
        branches: branches || [branch, ...Array(faker.random.number()).fill(0).map(i => faker.random.word())],
        branch,
      });
    } else {
      throw new Error(`Required arg 'type' isn't valid: should be repo or fork-all`);
    }
  }

  makeLink({name, enabled, hookId, owner, upstream, fork}={}) {
    let operations = {upstream, fork};

    if (typeof upstream === 'object' && upstream.hasOwnProperty) {
      operations.upstream = this.makeRepository('repo', upstream).then(repo => {
        upstream = repo;
      });
    }

    if (typeof fork === 'object' && fork.hasOwnProperty) {
      operations.fork = makeRepository('repo', fork).then(repo => {
        fork = repo;
      });
    }

    return Promise.props(operations).then(({fork, upstream}) => {
      console.log('fork', fork, 'upstream', upstream);
      return this.Link.create({
        name: name || faker.internet.userName(),
        enabled: enabled || false,
        hookId: hookId || Array(faker.random.number()).fill(0).map(i => faker.random.number()),
        ownerId: owner,
        upstreamId: upstream,
        forkId: fork,
      });
    });
  }
}
