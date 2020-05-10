import Vue from 'vue';
// import VueRouter from 'vue-router';
// import Vuex from 'vuex';

// Vue.use(VueRouter)
// Vue.use(Vuex)

import defaultView from './defaultView.vue'

export function generateRoutes(context, intercept) {
  // validate
  if (!context) throw "this is no context";

  const keys = context
    .keys()
    .filter((key) => /\.vue$/.test(key) && !/component/.test(key));
  if (keys.length == 0) throw "this context has no vue key!";

  let routes = [];
  keys
    .filter((key) => !/\/index\.vue$/.test(key))
    .forEach((key) => {
      const path = key.substring(0, key.length - 4).split("/");
      path[0] = "/";
      addRoute(routes, path, context(key));
    });
  keys
    .filter((key) => /\/index\.vue$/.test(key)).sort().reverse()
    .forEach((key) => {
      const path = key.substring(0, key.length - 10).split("/");
      path[0] = "/";
      addRoute(routes, path, context(key));
    });

  if (typeof intercept == 'function') {
    routes = intercept(routes)
  }
  console.log(routes)
  // return new VueRouter({
  //   mode: "history",
  //   routes,
  // });
  return routes
}

function addRoute(routes, path, view) {
  let parent = routes;
  for (let i = 0; i < path.length - 1; i++) {
    const temp = parent.find((route) => route.path == path[i]);
    if (temp) {
      if (!temp.children) temp.children = [];
      parent = temp.children;
    } else {
      const route = {
        path: path[i],
        component: defaultView,
        children: [],
      };
      parent.push(route);
      parent = route.children;
    }
  }

  const route = {
    path: path[path.length - 1],
    //component: () => Promise.resolve(view.default),
    component: view.default,
    ...(view.route || {}),
  };
  const index = parent.findIndex(
    (route) => route.path == path[path.length - 1]
  );
  if (index >= 0) {
    parent[index] = { ...parent[index], ...route };
  } else {
    parent.push(route);
  }
}

export function generateStore(context, intercept) {
  // validate
  if (!context) throw "this is no context";

  // filter js file key
  const keys = context
    .keys()
    .filter((key) => /\.js$/.test(key));
  if (keys.length == 0) throw "there is no js file key";

  let store = {};
  keys.forEach((key) => {
    const path = /\/index\.js$/.test(key)
      ? key.substring(0, key.length - 9).split("/")
      : key.substring(0, key.length - 3).split("/");

    if (path.length == 1) {
      store = { ...store, ...context(key).default };
    } else {
      let parent = store;
      for (let i = 1; i < path.length - 1; i++) {
        if (!parent.modules) parent.modules = {};
        if (!parent.modules[path[i]]) parent.modules[path[i]] = {};
        parent = parent.modules[path[i]];
      }
      if (!parent.modules) parent.modules = {};
      if (parent.modules[path[path.length - 1]]) {
        parent.modules[path[path.length - 1]] = {
          ...parent.modules[path[path.length - 1]],
          ...context(key).default,
        };
      } else {
        parent.modules[path[path.length - 1]] = context(key).default;
      }
    }
  });

  if (typeof intercept == 'function') {
    store = intercept(store)
  }
  console.log(store)
  // return new Vuex.Store(store);
  return store
}

// const VueAutoGenerator = {
//   App: defaultView
// };
// VueAutoGenerator.install = function (Vue, options) {
  
//   const router = generateRouter(options.routerContext, options.routerIntercept)
//   const store = generateStore(options.storeContext, options.storeIntercept)
//   Vue.mixin({
//     router,
//     store,
//     render: function (h) { return h(defaultView) },
//   })
// }

// export default VueAutoGenerator