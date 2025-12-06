import React, { useState, useEffect } from 'react';
import { SEO } from '../../seo-tools/SEOTags';
import { Icon } from '../Layout';
import ReactMarkdown from 'react-markdown'; 
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#000000', '#FEC43D', '#2563EB', '#999999', '#555555'];

// Safe Regex Literal to capture JSON blocks
const JSON_REGEX = /