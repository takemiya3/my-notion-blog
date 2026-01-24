import { Client } from '@notionhq/client';

if (!process.env.NOTION_API_KEY) {
  throw new Error('NOTION_API_KEY is not defined');
}
if (!process.env.NOTION_PERSON_DB_ID) {
  throw new Error('NOTION_PERSON_DB_ID is not defined');
}
if (!process.env.NOTION_CONTENT_DB_ID) {
  throw new Error('NOTION_CONTENT_DB_ID is not defined');
}

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export async function getPeople() {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_PERSON_DB_ID,
    filter: {
      property: '公開ステータス',
      checkbox: {
        equals: true,
      },
    },
  });
  return response.results;
}

export async function getContents() {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_CONTENT_DB_ID,
    filter: {
      property: '公開ステータス',
      checkbox: {
        equals: true,
      },
    },
    sorts: [
      {
        property: '公開日',
        direction: 'descending',
      },
    ],
  });
  return response.results;
}

export async function getPeopleByCategory(category: string) {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_PERSON_DB_ID,
    filter: {
      and: [
        {
          property: '公開ステータス',
          checkbox: {
            equals: true,
          },
        },
        {
          property: 'カテゴリ',
          multi_select: {
            contains: category,
          },
        },
      ],
    },
  });
  return response.results;
}

export async function getContentsByCategory(category: string) {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_CONTENT_DB_ID,
    filter: {
      and: [
        {
          property: '公開ステータス',
          checkbox: {
            equals: true,
          },
        },
        {
          property: 'カテゴリ',
          multi_select: {
            contains: category,
          },
        },
      ],
    },
    sorts: [
      {
        property: '閲覧数',
        direction: 'descending',
      },
    ],
  });
  return response.results;
}