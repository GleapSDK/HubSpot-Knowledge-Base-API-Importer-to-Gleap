import axios from 'axios';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
import Mention from '@tiptap/extension-mention';
import TextStyle from '@tiptap/extension-text-style';
import Youtube from '@tiptap/extension-youtube';
import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from "@tiptap/extension-link";
import { Node } from '@tiptap/core';
import FormData from 'form-data';

import * as lowlight from './lowlight.js';

// CONFIGURATION

// Add your Gleap token here.
// Read the following docs to learn how to obtain one:
// https://documenter.getpostman.com/view/18586034/2s8YRiJYVC#3c381598-d1bc-42f2-9fc4-6d31bb8666df
const gleapToken = 'Bearer YOUR_BREARER_TOKEN_HERE';

// This is your project ID (can be found in the URL when opening your project in Gleap)
const gleapProjectId = 'YOUR_PROJECT_ID_HERE';

// This is the Gleap user ID of the default author.
// Obtain it by posting to https://api.gleap.io/users/me with your Gleap auth bearer.
const gleapAuthorId = 'YOUR_AUTHOR_ID_HERE';

// These informations need to be intercepted from a request in the Hubspot UI
// Simply open the network tab in the browser and copy the information from a request
// The request you are looking for is: https://app-eu1.hubspot.com/api/knowledge-content/v1/knowledge-articles
const portalId = 25290844;
const knowledgeBaseId = 70444117434;
const appVersion = 1.46085;
// Auth headers.
const headers = {
  'x-hubspot-csrf-hubspotapi': 'YOUR_HUBSPOT_API_CSRF_TOKEN_HERE',
  'cookie': 'YOUR_HUBSPOT_COOKIE_HERE' // The cookie is used to authenticate the request,
};

// CONFIGURATION END

// Importer code comes below.
async function getHelpCenterArticles() {
  const url = 'https://app-eu1.hubspot.com/api/knowledge-content/v1/knowledge-articles';

  const params = {
    portalId: portalId,
    contentGroupId: knowledgeBaseId,
    clienttimeout: 14000,
    hs_static_app: 'knowledge-content-ui',
    hs_static_app_version: appVersion,
    property: ['absoluteUrl', 'author', 'authorName', 'archived', 'articleBody', 'articleSummary', 'created', 'customSlugEnding', 'generator', 'hasTranslatedContent', 'id', 'knowledgeBaseCategory', 'knowledgeBaseSubcategory', 'knowledgeCategoryId', 'language', 'lastLoaded', 'publicAccessRules', 'publicAccessRulesEnabled', 'contentGroupId', 'name', 'position', 'previewKey', 'publishedAt', 'state', 'tagIds', 'title', 'translatedContent', 'translatedContentArticleBody', 'translatedContentLanguages', 'translatedFromId', 'updated', 'headHtml', 'htmlTitle', 'metaDescription'],
    archived: false,
    limit: 1000,
    offset: 0,
    order: '-updated',
    translated_from_id__is_null: '',
  };

  try {
    const response = await axios.get(url, { params, headers });
    const articles = response.data.objects;
    return articles;
  } catch (error) {
    console.error(error);
    return [];
  }
}

const CustomLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      linktype: {
        default: 'link',
        renderHTML: (attributes) => {
          return {
            'data-linktype': attributes.linktype,
            class: `linktype-${attributes.linktype}`,
          };
        },
      },
      bgcolor: {
        default: '#485bff',
        renderHTML: (attributes) => {
          if (attributes.linktype !== 'button') {
            return null;
          }
          return {
            'data-bgcolor': attributes.bgcolor,
            style: `background-color: ${attributes.bgcolor};`,
          };
        },
      },
    };
  },
});

const HelpCenterArticleExtension = Node.create({
  name: 'helpCenterArticle',
  group: 'block',
  atom: true,

  renderHTML({ HTMLAttributes }) {
    const { articleId, articleTitle, articleDescription, articleUrl } = HTMLAttributes;

    const html = `<div class="helpcenter-conversation-article"><div class="article-header-container"><a href="${articleUrl}"><div class="article-header">${articleTitle}</div></a></div><div class="article-description">${articleDescription}</div></div>`;

    return ['helpcenterarticle', HTMLAttributes, html];
  },

  addAttributes() {
    return {
      articleId: {
        default: null,
      },
      articleTitle: {
        default: 'No title',
      },
      articleDescription: {
        default: 'No description',
      },
      articleUrl: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'helpcenterarticle',
        getAttrs: (node) => {
          if (typeof node === 'string') {
            return {};
          }

          if (node.nodeType !== 1 /* Node.ELEMENT_NODE */) {
            return {};
          }

          const element = node;
          return {
            articleId: element.getAttribute('articleId') || null,
            articleTitle: element.getAttribute('articleTitle') || 'No title',
            articleDescription: element.getAttribute('articleDescription') || 'No description',
            articleUrl: element.getAttribute('articleUrl') || null,
          };
        },
      },
    ];
  },

  renderText() {
    return '';
  },
});

async function downloadAndUploadImage(url) {
  // Download the image
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'arraybuffer' // to handle binary data
  });

  // Prepare the data for uploading
  const buffer = Buffer.from(response.data, 'binary');
  const formdata = new FormData();
  formdata.append("file", buffer, {
    contentType: response.headers['content-type'],
    filename: url.substring(url.lastIndexOf('/') + 1),
  });

  // Upload the image
  const uploadResponse = await axios({
    method: 'POST',
    url: "https://api.gleap.io/uploads",
    headers: {
      'Authorization': gleapToken,
    },
    data: formdata
  });

  return uploadResponse.data.fileUrl;
}

async function replaceImageUrl(url) {
  return await downloadAndUploadImage(url);
}

async function replaceSrcValues(obj) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = await replaceSrcValues(obj[i]);
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (let key in obj) {
      if (key === 'src') {
        // If the key is 'src', replace its value by awaiting the result of replaceImageUrl
        obj[key] = await replaceImageUrl(obj[key]);
      } else {
        // If the key isn't 'src', continue searching inside this object
        obj[key] = await replaceSrcValues(obj[key]);
      }
    }
  }

  // Return the modified object or array
  return obj;
}

async function htmlToJSON(content) {
  // Fix images being enclosed.
  content = content.replace(/<(p|div)>(<img[^>]*>)<\/(p|div)>/g, '$2');

  try {
    var json = generateJSON(content, [
      StarterKit.configure({ codeBlock: false, heading: false }),
      Heading.configure({
        levels: [1, 2, 3, 4],
      }),
      Mention,
      CustomLink,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Image,
      TextStyle,
      HelpCenterArticleExtension,
      Youtube.configure(),
    ]);

    json = await replaceSrcValues(json);

    return json;
  } catch (exp) {
    console.log(exp);
  }

  return null;
}

async function getCategories(languages) {
  const categoriesUrl = 'https://app-eu1.hubspot.com/api/knowledge-content/v1/knowledge-category-translations/categories-translations';

  const categoriesParams = {
    hs_static_app: 'knowledge-content-ui',
    hs_static_app_version: appVersion,
    portalId: portalId,
    language: [languages],
    knowledgeBaseId: knowledgeBaseId,
    clienttimeout: 15000,
  };

  try {
    const response = await axios.get(categoriesUrl, { params: categoriesParams, headers });
    return response.data.categories;
  } catch (error) {
    console.error(error);
    return [];
  }
}


async function getArticleDetails(articleId) {
  const detailUrl = `https://app-eu1.hubspot.com/api/knowledge-content/v1/knowledge-articles/${articleId}/edit-info`;

  const detailParams = {
    property: ['absoluteUrl', 'author', 'authorName', 'archived', 'articleBody', 'articleSummary', 'created', 'customSlugEnding', 'knowledgeCategoryId', 'generator', 'id', 'knowledgeBaseCategory', 'knowledgeBaseSubcategory', 'language', 'lastLoaded', 'publicAccessRules', 'publicAccessRulesEnabled', 'name', 'position', 'previewKey', 'publishedAt', 'state', 'tagIds', 'title', 'htmlTitle', 'updated', 'headHtml', 'metaDescription', 'translatedContent.*.id', 'translatedContent.*.language', 'translatedContent.*.name', 'translatedContent.*.state', 'translatedFromId', 'contentGroupId'],
    hs_static_app: 'knowledge-content-ui',
    hs_static_app_version: appVersion,
    portalId: portalId,
    clienttimeout: 15000,
  };

  try {
    const response = await axios.get(detailUrl, { params: detailParams, headers });
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function loadAllArticles() {
  console.log(`Loading articles from HubSpot...`)

  const articles = await getHelpCenterArticles();
  var finalArticles = [];
  var languages = {};

  // Iterate through every article:
  for (const article of articles) {
    var articleData = {};

    articleData = {
      title: {
        [article.language]: article.title,
      },
      description: {
        [article.language]: article.metaDescription,
      },
      body: {
        [article.language]: await htmlToJSON(article.articleBody),
      },
      knowledgeCategoryId: article.knowledgeCategoryId,
    }

    languages[article.language] = true;

    var langKeys = Object.keys(article.translatedContent);

    // Iterate through every key
    for (const key of langKeys) {
      const translatedArticlePre = article.translatedContent[key];
      const translatedArticle = await getArticleDetails(translatedArticlePre.id, key);
      if (translatedArticle && translatedArticle.article) {
        articleData.title[key] = translatedArticle.article.title;
        articleData.description[key] = translatedArticle.article.metaDescription;
        articleData.body[key] = await htmlToJSON(translatedArticle.article.articleBody);
        languages[key] = true;
      }
    }

    finalArticles.push(articleData);

    // Log the progress
    console.log(`Loaded ${finalArticles.length} of ${articles.length} articles`);
  }

  console.log(`Loaded ${articles.length} articles`);

  return {
    articles: finalArticles,
    languages: Object.keys(languages),
  };
}

async function createGleapCategory(category) {
  var title = {};
  var description = {};

  for (const translation of category.nameTranslations) {
    title[translation.language] = translation.name;
    description[translation.language] = translation.name;
  }

  let data = JSON.stringify({ title, description, iconUrl: "" });
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.gleap.io/projects/' + gleapProjectId + '/helpcenter/collections',
    headers: {
      'Authorization': gleapToken,
      'Content-Type': 'application/json'
    },
    data: data
  };

  const response = await axios.request(config);
  return response.data?.id;
}

async function createGleapArticle(article, categoryMap) {
  const helpcenterCollection = categoryMap[article.knowledgeCategoryId];

  const postArticleUrl = 'https://api.gleap.io/projects/' + gleapProjectId + '/helpcenter/collections/' + helpcenterCollection + '/articles';

  const articleData = {
    title: article.title,
    description: article.description,
    content: article.body,
    helpcenterCollection: helpcenterCollection,
    author: gleapAuthorId,
  };

  try {
    let data = JSON.stringify(articleData);
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: postArticleUrl,
      headers: {
        'Authorization': gleapToken,
        'Content-Type': 'application/json'
      },
      data: data
    };

    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function importArticles() {
  const articles = await loadAllArticles();

  const categories = await getCategories(articles.languages);

  var categoryMap = {};

  // Iterate through every category
  for (const category of categories) {
    const categoryId = await createGleapCategory(category);

    // Add to Gleap mapping.
    categoryMap[category.knowledgeCategoryId] = categoryId;
  }

  // Iterate through every article
  for (const article of articles.articles) {
    await createGleapArticle(article, categoryMap);

    // Log the progress in percentage
    console.log(`Imported ${Math.round(100 * (articles.articles.indexOf(article) + 1) / articles.articles.length)}% of articles`);
  }

  console.log(`Imported ${articles.articles.length} articles`);
  console.log("DONE ✅");
}

importArticles();