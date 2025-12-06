import React, { useState, useEffect } from 'react';
import { SEO } from '../../seo-tools/SEOTags';
import { Icon } from '../Layout';
import ReactMarkdown from 'react-markdown'; 
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#000000', '#FEC43D', '#2563EB', '#999999', '#555555'];
const JSON_REGEX = new RegExp('