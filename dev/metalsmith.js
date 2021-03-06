'use strict';

const Metalsmith = require('metalsmith');
const layouts = require('metalsmith-layouts');
const prism = require('metalsmith-prism');
const marked = require('marked');
const markdown = require('metalsmith-markdown');
const inPlace = require('metalsmith-in-place');
const mock = require('metalsmith-mock');
const permalinks = require('metalsmith-permalinks');
const nunjucks = require('nunjucks');
const nunjucksDate = require('nunjucks-date');
const globby = require('globby');
const merge = require('lodash.merge');
const readFile = require('./plugins/metalsmith-read-file');
const path = require('path');
const slugifi = require('slugify');
const collections = require('metalsmith-collections');
const relative = require('metalsmith-rootpath');
const Logger = require('availity-workflow-logger');

const tocify = require('./plugins/metalsmith-tocify');

const pkg = require('../package.json');

const markedOptions = {
  langPrefix: 'language-',
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true
};

function slugify(tokens) {
  const slugged = slugifi(tokens).toLowerCase();
  return slugged;
}

nunjucksDate
  .setDefaultFormat('YYYY');

const env = nunjucks.configure('docs/layouts', {
  watch: false,
  noCache: true,
  tags: {
    variableStart: '{{{',
    variableEnd: '}}}'
  }
});
env.addFilter('year', nunjucksDate);
env.addFilter('slug', slugify);

function build() {

  Logger.info('Started docs');

  return new Promise((resolve, reject) => {

    const metalsmith = new Metalsmith(path.join(process.cwd(), 'docs'));

    metalsmith
      .metadata({
        site: {
          title: 'Availity Angular'
        },
        today: new Date(),
        pkg
      })
      .ignore(['!**/*.html', 'node_modules', '_book', 'dev', 'dist', 'less', 'reports'])
      .source(path.join(process.cwd(), 'docs', 'content'))
      .use( (files, metal, done) => {

        globby(['src/**/docs/*.html']).then( filePaths => {

          const fileConfigs = filePaths.map(filePath => {
            return readFile(metal, filePath);
          });

          const metalFiles = {};

          fileConfigs.forEach(fileConfig => {
            const dir = path.join(process.cwd(), 'src');
            const fileName = path.relative(dir, fileConfig.path);
            metalFiles[fileName] = fileConfig;
          });

          merge(files, metalFiles);

          done();

        });

      })
      .use(markdown(markedOptions))
      .use(prism({
        decode: true
      }))
      .use(mock())
      .use(collections({
        pages: {
          pattern: 'pages/*.html',
          reverse: false
        },
        ui: {
          pattern: '**/ui/**/docs/*.html',
          sortBy: 'title',
          reverse: false,
          refer: false
        },
        core: {
          pattern: '**/core/**/docs/*.html',
          sortBy: 'title',
          reverse: false,
          refer: false
        }
      }))
      .use(permalinks({
        relative: false
      }))
      .use(relative())
      .use(inPlace({
        engine: 'nunjucks',
        partials: 'layouts/partials'
      }))
      .use(tocify({selector: '.docs-section-header, .docs-subsection-title'}))
      .use(layouts({
        engine: 'nunjucks',
        directory: 'layouts'
      }))
      .destination(path.join(process.cwd(), 'build'));

    metalsmith.build( (err) => {

      if (err) {
        reject(err);
      } else {
        Logger.success('Finished docs');
        resolve();
      }

    });

  });

}

module.exports = build;
