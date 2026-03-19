{\rtf1\ansi\ansicpg1252\cocoartf2868
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 export default async function handler(req, res) \{\
  const \{ q, from, to \} = req.query;\
\
  const params = new URLSearchParams(\{\
    q,\
    lang: 'en',\
    max: '5',\
    from,\
    to,\
    sortby: 'publishedAt',\
    token: '5c79a5bb0e1e709423f7835d3a7e6400',\
  \});\
\
  const response = await fetch('https://gnews.io/api/v4/search?' + params);\
  const data = await response.json();\
\
  res.status(response.status).json(data);\
\}}