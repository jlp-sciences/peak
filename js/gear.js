/* Peak — detailed drawings of the climber's gear (200 × 200). On the climber itself the gear is simplified. */
const GEAR_ART = {
boots:`<ellipse cx="100" cy="172" rx="72" ry="8" fill="#000" opacity=".28"/>
<path d="M38 150 L160 150 Q172 150 172 160 L172 166 L38 166 Q30 166 30 158 Z" fill="#2A2A2E"/>
<path d="M44 166 l6 -8 M62 166 l6 -8 M80 166 l6 -8 M98 166 l6 -8 M116 166 l6 -8 M134 166 l6 -8 M152 166 l6 -8" stroke="#45454B" stroke-width="3"/>
<rect x="34" y="138" width="138" height="14" rx="6" fill="#D8D2C4"/>
<path d="M50 140 L52 70 Q52 58 64 58 L96 58 Q104 58 106 66 L112 92 Q118 104 134 110 L158 120 Q170 126 168 140 Z" fill="#8A5A32"/>
<path d="M120 111 Q150 118 166 130 L168 140 L124 140 Z" fill="#6E4524"/>
<path d="M50 140 L52 100 Q72 104 76 140 Z" fill="#6E4524"/>
<path d="M58 96 Q90 100 112 92" stroke="#6E4524" stroke-width="3" fill="none"/>
<path d="M84 58 L98 38 Q105 34 109 40 L106 66 Z" fill="#A66E3E"/>
<rect x="48" y="50" width="62" height="13" rx="6.5" fill="#3A3F4B"/>
<rect x="44" y="42" width="9" height="18" rx="3" fill="#E35D5D"/>
<path d="M84 70 L104 74 L86 82 L108 88 L90 96 L112 100" stroke="#E35D5D" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<g fill="#C9D0DB"><circle cx="84" cy="70" r="3"/><circle cx="86" cy="82" r="3"/><circle cx="90" cy="96" r="3"/><circle cx="104" cy="74" r="3"/><circle cx="108" cy="88" r="3"/></g>
<path d="M60 72 Q62 66 70 64" stroke="#fff" stroke-opacity=".3" stroke-width="4" fill="none" stroke-linecap="round"/>`,
backpack:`<ellipse cx="100" cy="186" rx="60" ry="7" fill="#000" opacity=".28"/>
<path d="M88 40 Q100 24 112 40" stroke="#3A3F4B" stroke-width="6" fill="none" stroke-linecap="round"/>
<rect x="55" y="44" width="90" height="128" rx="24" fill="#FF9E4A"/>
<path d="M79 44 Q57 44 55 68 L55 148 Q55 172 79 172 L72 172 Q66 120 79 44" fill="#E5873A"/>
<path d="M55 74 Q55 40 100 40 Q145 40 145 74 L145 82 L55 82 Z" fill="#D97B2E"/>
<path d="M66 76 Q100 68 134 76" stroke="#3A3F4B" stroke-width="2" fill="none" stroke-dasharray="4 3"/>
<rect x="70" y="108" width="60" height="52" rx="15" fill="#F08F40"/>
<path d="M76 120 Q100 112 124 120" stroke="#3A3F4B" stroke-width="2" fill="none"/>
<rect x="96" y="116" width="8" height="6" rx="2" fill="#C9D0DB"/>
<rect x="60" y="94" width="80" height="7" rx="3" fill="#3A3F4B"/><rect x="94" y="92" width="12" height="11" rx="2" fill="#C9D0DB"/>
<circle cx="100" cy="142" r="9" fill="#171A20"/><path d="M95 146 L100 137 L105 146" stroke="#5EA2FF" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M100 137 L105 146" stroke="#FF9E4A" stroke-width="2.2" stroke-linecap="round"/>
<rect x="44" y="166" width="112" height="20" rx="10" fill="#5EA2FF"/><path d="M60 166 v20 M140 166 v20" stroke="#3A3F4B" stroke-width="4"/><circle cx="48" cy="176" r="6" fill="#3F82DE"/><circle cx="48" cy="176" r="2.5" fill="#2B5FB0"/>
<path d="M66 54 Q72 48 82 47" stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round"/>`,
poles:`<ellipse cx="100" cy="186" rx="64" ry="7" fill="#000" opacity=".28"/>
${[-20,20].map(a=>`<g transform="translate(100 100) rotate(${a})"><rect x="-7" y="-86" width="14" height="36" rx="6" fill="#2A2A2E"/><path d="M-7 -78 h14 M-7 -70 h14 M-7 -62 h14" stroke="#45454B" stroke-width="2"/><path d="M-6 -82 Q-24 -62 -6 -50" stroke="#5EA2FF" stroke-width="3.5" fill="none"/><rect x="-4" y="-50" width="8" height="62" fill="#5EA2FF"/><rect x="-4" y="-50" width="3" height="62" fill="#3F82DE"/><rect x="-6" y="12" width="12" height="7" rx="2" fill="#3A3F4B"/><rect x="-3" y="19" width="6" height="56" fill="#C9D0DB"/><ellipse cx="0" cy="66" rx="13" ry="4" fill="#2A2A2E"/><polygon points="-3,75 3,75 0,86" fill="#8A93A3"/></g>`).join('')}`,
axe:`<ellipse cx="100" cy="186" rx="66" ry="7" fill="#000" opacity=".28"/>
<g transform="translate(78 104) rotate(-16)"><rect x="-5" y="-50" width="10" height="116" rx="3" fill="#5EA2FF"/><rect x="-5" y="-50" width="4" height="116" fill="#3F82DE"/><rect x="-6.5" y="28" width="13" height="34" rx="3" fill="#2A2A2E"/><polygon points="-5,64 5,64 0,82" fill="#C9D0DB"/>
<path d="M0 -58 L68 -44 Q74 -40 64 -38 L4 -44 Z" fill="#C9D0DB"/><path d="M30 -46 l3 4 l3 -4 l3 4 l3 -4 l3 4 l3 -4" stroke="#8A93A3" stroke-width="1.6" fill="none"/><path d="M0 -62 L-34 -64 L-37 -50 L0 -48 Z" fill="#AEB6C2"/><rect x="-8" y="-66" width="16" height="24" rx="3" fill="#8A93A3"/><circle cx="0" cy="-54" r="3" fill="#2A2F38"/><path d="M5 -40 Q22 -10 6 20" stroke="#E35D5D" stroke-width="2.5" fill="none"/></g>
<g transform="translate(142 150)"><path d="M-28 -6 Q0 -18 28 -6 L24 10 L-24 10 Z" fill="none" stroke="#8A93A3" stroke-width="5" stroke-linejoin="round"/><g fill="#C9D0DB">${[-22,-11,0,11,22].map(x=>`<polygon points="${x-3},10 ${x+3},10 ${x},24"/>`).join('')}<polygon points="26,-4 32,-6 36,-14"/></g><path d="M-18 -10 Q0 -30 18 -10" stroke="#FF9E4A" stroke-width="4" fill="none" stroke-linecap="round"/></g>`,
jacket:`<ellipse cx="100" cy="184" rx="70" ry="7" fill="#000" opacity=".28"/>
<path d="M58 52 L84 40 Q100 52 116 40 L142 52 L172 118 L150 128 L140 100 L140 174 Q100 180 60 174 L60 100 L50 128 L28 118 Z" fill="#E35D5D"/>
<path d="M58 52 L84 40 Q92 46 100 48 L100 178 Q80 178 60 174 L60 100 L50 128 L28 118 Z" fill="#000" opacity=".1"/>
<g stroke="#C94848" stroke-width="2.5" fill="none"><path d="M60 72 Q100 78 140 72"/><path d="M60 96 Q100 102 140 96"/><path d="M60 120 Q100 126 140 120"/><path d="M60 146 Q100 152 140 146"/><path d="M48 76 L38 98 M152 76 L162 98"/><path d="M42 100 L34 116 M158 100 L166 116"/></g>
<path d="M82 40 Q100 28 118 40 L120 52 Q100 62 80 52 Z" fill="#C94848"/>
<line x1="100" y1="52" x2="100" y2="178" stroke="#3A3F4B" stroke-width="3"/><rect x="97" y="64" width="6" height="11" rx="2" fill="#C9D0DB"/>
<circle cx="122" cy="72" r="7" fill="#171A20"/><path d="M118 75 L122 68 L126 75" stroke="#5EA2FF" stroke-width="1.8" fill="none"/><path d="M122 68 L126 75" stroke="#FF9E4A" stroke-width="1.8"/>
<path d="M120 56 Q130 58 136 66" stroke="#fff" stroke-opacity=".3" stroke-width="4" fill="none" stroke-linecap="round"/>`,
helmet:`<ellipse cx="100" cy="176" rx="68" ry="8" fill="#000" opacity=".28"/>
<path d="M36 132 Q34 56 100 50 Q166 56 164 132 Z" fill="#F1EFE8"/>
<path d="M100 50 Q166 56 164 132 L130 132 Q140 80 100 50" fill="#D8D4CA"/>
<g fill="#2A2F38"><rect x="74" y="62" width="10" height="22" rx="5"/><rect x="95" y="58" width="10" height="24" rx="5"/><rect x="116" y="62" width="10" height="22" rx="5"/></g>
<rect x="34" y="124" width="132" height="12" rx="6" fill="#F2C14E"/>
<rect x="30" y="100" width="140" height="13" rx="6.5" fill="#FF9E4A"/>
<path d="M58 92 Q100 84 142 92 L144 118 Q122 128 100 120 Q78 128 56 118 Z" fill="#2A2A2E"/>
<path d="M63 96 Q100 89 137 96 L138 115 Q120 123 100 116 Q80 123 62 115 Z" fill="#5C7FD1"/>
<path d="M72 114 L92 94 M84 117 L104 97" stroke="#fff" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>
<path d="M54 70 Q66 58 82 56" stroke="#fff" stroke-opacity=".6" stroke-width="5" fill="none" stroke-linecap="round"/>`,
flag:`<ellipse cx="100" cy="172" rx="76" ry="16" fill="#E9EEF5"/><ellipse cx="100" cy="176" rx="76" ry="12" fill="#C9D3E0"/><ellipse cx="86" cy="168" rx="34" ry="6" fill="#fff"/>
<rect x="64" y="34" width="7" height="140" rx="3" fill="#C9D0DB"/><rect x="64" y="34" width="3" height="140" fill="#AEB6C2"/><circle cx="67.5" cy="31" r="6" fill="#F2C14E"/>
<path d="M71 40 Q108 26 152 44 Q134 68 154 92 Q110 76 71 90 Z" fill="#F2F4F7"/><path d="M71 40 Q90 34 104 34 Q96 60 104 84 Q90 84 71 90 Z" fill="#000" opacity=".06"/>
<path d="M96 76 L112 50" stroke="#5EA2FF" stroke-width="7" stroke-linecap="round"/><path d="M112 50 L128 76" stroke="#FF9E4A" stroke-width="7" stroke-linecap="round"/><circle cx="112" cy="40" r="4.5" fill="#171A20"/>
<path d="M150 120 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 z" fill="#F2C14E"/>`,
karakoram:`<ellipse cx="100" cy="184" rx="70" ry="7" fill="#000" opacity=".28"/>
<path d="M58 52 L84 40 Q100 52 116 40 L142 52 L172 118 L150 128 L140 100 L140 174 Q100 180 60 174 L60 100 L50 128 L28 118 Z" fill="#2DD4BF"/>
<path d="M58 52 L84 40 Q92 46 100 48 L100 178 Q80 178 60 174 L60 100 L50 128 L28 118 Z" fill="#000" opacity=".1"/>
<g stroke="#1A9E8C" stroke-width="2.5" fill="none"><path d="M60 72 Q100 78 140 72"/><path d="M60 96 Q100 102 140 96"/><path d="M60 120 Q100 126 140 120"/><path d="M60 146 Q100 152 140 146"/><path d="M48 76 L38 98 M152 76 L162 98"/><path d="M42 100 L34 116 M158 100 L166 116"/></g>
<path d="M82 40 Q100 28 118 40 L120 52 Q100 62 80 52 Z" fill="#1A9E8C"/>
<line x1="100" y1="52" x2="100" y2="178" stroke="#3A3F4B" stroke-width="3"/><rect x="97" y="64" width="6" height="11" rx="2" fill="#C9D0DB"/>
<circle cx="122" cy="72" r="7" fill="#171A20"/><path d="M118 75 L122 68 L126 75" stroke="#5EA2FF" stroke-width="1.8" fill="none"/><path d="M122 68 L126 75" stroke="#FF9E4A" stroke-width="1.8"/>
<path d="M120 56 Q130 58 136 66" stroke="#fff" stroke-opacity=".3" stroke-width="4" fill="none" stroke-linecap="round"/>`,
annapurna:`<ellipse cx="100" cy="184" rx="70" ry="7" fill="#000" opacity=".28"/>
<path d="M58 52 L84 40 Q100 52 116 40 L142 52 L172 118 L150 128 L140 100 L140 174 Q100 180 60 174 L60 100 L50 128 L28 118 Z" fill="#C084FC"/>
<path d="M58 52 L84 40 Q92 46 100 48 L100 178 Q80 178 60 174 L60 100 L50 128 L28 118 Z" fill="#000" opacity=".1"/>
<g stroke="#9A5FD8" stroke-width="2.5" fill="none"><path d="M60 72 Q100 78 140 72"/><path d="M60 96 Q100 102 140 96"/><path d="M60 120 Q100 126 140 120"/><path d="M60 146 Q100 152 140 146"/><path d="M48 76 L38 98 M152 76 L162 98"/><path d="M42 100 L34 116 M158 100 L166 116"/></g>
<path d="M82 40 Q100 28 118 40 L120 52 Q100 62 80 52 Z" fill="#9A5FD8"/>
<line x1="100" y1="52" x2="100" y2="178" stroke="#3A3F4B" stroke-width="3"/><rect x="97" y="64" width="6" height="11" rx="2" fill="#C9D0DB"/>
<circle cx="122" cy="72" r="7" fill="#171A20"/><path d="M118 75 L122 68 L126 75" stroke="#5EA2FF" stroke-width="1.8" fill="none"/><path d="M122 68 L126 75" stroke="#FF9E4A" stroke-width="1.8"/>
<path d="M120 56 Q130 58 136 66" stroke="#fff" stroke-opacity=".3" stroke-width="4" fill="none" stroke-linecap="round"/>`,
hat:`<ellipse cx="100" cy="160" rx="66" ry="7" fill="#000" opacity=".28"/>
<ellipse cx="100" cy="122" rx="78" ry="22" fill="#B08A52"/><ellipse cx="100" cy="118" rx="78" ry="20" fill="#C9A066"/>
<path d="M56 118 Q58 64 100 60 Q142 64 144 118 Q100 130 56 118 Z" fill="#C9A066"/><path d="M100 60 Q142 64 144 118 Q124 124 110 124 Q122 90 100 60" fill="#B08A52"/>
<path d="M57 104 Q100 116 143 104 L144 116 Q100 128 56 116 Z" fill="#6E4524"/>
<path d="M70 80 Q78 70 92 66" stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round"/>`,
rope:`<ellipse cx="100" cy="176" rx="68" ry="8" fill="#000" opacity=".28"/>
${[0,1,2,3,4].map(i=>`<ellipse cx="100" cy="${100+i*3}" rx="${64-i*9}" ry="${52-i*8}" fill="none" stroke="${i%2?'#FF9E4A':'#F08F40'}" stroke-width="10"/>`).join('')}
<ellipse cx="100" cy="100" rx="64" ry="52" fill="none" stroke="#5EA2FF" stroke-width="2" stroke-dasharray="3 9"/>
<path d="M150 136 Q168 150 160 170" stroke="#FF9E4A" stroke-width="10" fill="none" stroke-linecap="round"/><rect x="152" y="166" width="16" height="10" rx="3" fill="#3A3F4B"/>`,
polarsuit:`<ellipse cx="100" cy="184" rx="70" ry="7" fill="#000" opacity=".28"/>
<path d="M58 56 L84 44 Q100 54 116 44 L142 56 L172 120 L150 130 L140 102 L140 176 Q100 182 60 176 L60 102 L50 130 L28 120 Z" fill="#E9EEF5"/>
<path d="M58 56 L84 44 Q92 50 100 52 L100 180 Q80 180 60 176 L60 102 L50 130 L28 120 Z" fill="#000" opacity=".08"/>
<g stroke="#AEB6C2" stroke-width="2" fill="none"><path d="M60 80 Q100 86 140 80"/><path d="M60 106 Q100 112 140 106"/><path d="M60 132 Q100 138 140 132"/><path d="M60 156 Q100 162 140 156"/></g>
<ellipse cx="100" cy="46" rx="30" ry="14" fill="#D8C7A6"/><ellipse cx="100" cy="46" rx="20" ry="8" fill="#6E5A3C"/>
<line x1="100" y1="58" x2="100" y2="180" stroke="#5EA2FF" stroke-width="3"/><rect x="28" y="114" width="22" height="10" rx="3" fill="#5EA2FF" transform="rotate(-24 39 119)"/><rect x="150" y="114" width="22" height="10" rx="3" fill="#5EA2FF" transform="rotate(24 161 119)"/>`,
beanie:`<ellipse cx="100" cy="166" rx="62" ry="7" fill="#000" opacity=".28"/>
<path d="M44 146 Q40 66 100 60 Q160 66 156 146 Z" fill="#5EA2FF"/><path d="M100 60 Q160 66 156 146 L126 146 Q138 90 100 60" fill="#3F82DE"/>
<g stroke="#3F82DE" stroke-width="3">${[60,72,84,96,108,120,132,144].map(x=>`<line x1="${x}" y1="${76+Math.abs(x-100)*.35}" x2="${x}" y2="124"/>`).join('')}</g>
<rect x="40" y="120" width="120" height="30" rx="12" fill="#2B5FB0"/><g stroke="#3F82DE" stroke-width="3">${[52,64,76,88,100,112,124,136,148].map(x=>`<line x1="${x}" y1="124" x2="${x}" y2="146"/>`).join('')}</g>
<circle cx="100" cy="50" r="18" fill="#F1EFE8"/><circle cx="94" cy="44" r="5" fill="#fff"/>`,
badge7:`<ellipse cx="100" cy="184" rx="52" ry="6" fill="#000" opacity=".28"/>
<polygon points="70,120 88,120 82,182 70,172 58,180" fill="#E35D5D"/><polygon points="112,120 130,120 142,180 130,172 118,182" fill="#C94848"/>
<circle cx="100" cy="92" r="60" fill="#B8862A"/><circle cx="100" cy="92" r="52" fill="#F5C95A"/><circle cx="100" cy="92" r="40" fill="#E8B53F"/>
<path d="M66 112 L88 74 L100 92 L108 82 L134 112 Z" fill="#B8862A"/><text x="100" y="80" text-anchor="middle" font-size="30" font-weight="800" fill="#3A2A12" font-family="Inter,system-ui">7</text>
<path d="M60 70 Q70 46 94 38" stroke="#fff" stroke-opacity=".5" stroke-width="6" fill="none" stroke-linecap="round"/>`,
prayer:`<ellipse cx="100" cy="182" rx="70" ry="6" fill="#000" opacity=".22"/>
<path d="M14 50 Q100 110 186 50" stroke="#C9D0DB" stroke-width="2.5" fill="none"/>
${[['#5EA2FF',30,62],['#F1EFE8',56,78],['#E35D5D',82,88],['#4ADE80',108,90],['#F2C14E',134,84],['#5EA2FF',160,70]].map(([c,x,y])=>`<path d="M${x-12} ${y} L${x+12} ${y} L${x+10} ${y+30} L${x-10} ${y+32} Z" fill="${c}"/><circle cx="${x}" cy="${y+15}" r="4" fill="#000" opacity=".15"/>`).join('')}
<rect x="10" y="44" width="6" height="140" fill="#8A93A3"/><rect x="184" y="44" width="6" height="140" fill="#8A93A3"/>`,
bivouac:`<ellipse cx="100" cy="164" rx="86" ry="16" fill="#E9EEF5"/>
<path d="M30 160 Q30 72 100 68 Q170 72 170 160 Z" fill="#F2C14E"/><path d="M100 68 Q170 72 170 160 L128 160 Q130 96 100 68" fill="#D9A72E"/>
<path d="M76 160 Q78 112 100 108 Q122 112 124 160 Z" fill="#2A2F38"/><path d="M48 160 Q50 86 100 82 Q150 86 152 160" stroke="#B8862A" stroke-width="3" fill="none"/>
<path d="M30 160 L12 172 M170 160 L188 172" stroke="#C9D0DB" stroke-width="2"/>`,
glasses:`<ellipse cx="100" cy="150" rx="74" ry="7" fill="#000" opacity=".25"/>
<path d="M22 96 Q16 80 30 76 L60 76" stroke="#2A2A2E" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M178 96 Q184 80 170 76 L140 76" stroke="#2A2A2E" stroke-width="7" fill="none" stroke-linecap="round"/>
<circle cx="66" cy="100" r="30" fill="#2A2A2E"/><circle cx="134" cy="100" r="30" fill="#2A2A2E"/><circle cx="66" cy="100" r="24" fill="#5C7FD1"/><circle cx="134" cy="100" r="24" fill="#5C7FD1"/>
<path d="M92 96 Q100 88 108 96" stroke="#2A2A2E" stroke-width="7" fill="none"/>
<path d="M32 90 Q30 108 40 120 L42 86 Z M168 90 Q170 108 160 120 L158 86 Z" fill="#3A3F4B"/>
<path d="M52 108 L72 86 M120 108 L140 86" stroke="#fff" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>`,
techaxe:`<ellipse cx="100" cy="186" rx="60" ry="7" fill="#000" opacity=".28"/>
<g transform="translate(96 104) rotate(-12)"><path d="M-4 -56 Q-14 0 -4 40 Q2 56 -2 66 L6 66 Q10 52 6 40 Q-4 0 6 -56 Z" fill="#F2C14E"/><rect x="-8" y="30" width="16" height="34" rx="4" fill="#2A2A2E"/><path d="M-10 46 h-10 v14 h10" stroke="#E35D5D" stroke-width="4" fill="none"/><polygon points="-4,66 6,66 1,82" fill="#C9D0DB"/>
<path d="M0 -60 Q40 -58 66 -32 Q60 -30 50 -38 Q30 -50 2 -48 Z" fill="#C9D0DB"/><path d="M30 -48 l4 4 l4 -4 l4 4 l4 -4" stroke="#8A93A3" stroke-width="1.6" fill="none"/><path d="M0 -64 L-24 -70 L-28 -56 L0 -50 Z" fill="#AEB6C2"/><rect x="-8" y="-68" width="16" height="24" rx="3" fill="#2A2A2E"/></g>`,
oxygen:`<ellipse cx="100" cy="182" rx="64" ry="7" fill="#000" opacity=".28"/>
<rect x="110" y="44" width="40" height="132" rx="20" fill="#FF9E4A"/><rect x="110" y="44" width="14" height="132" rx="7" fill="#E5873A"/><rect x="120" y="30" width="20" height="18" rx="4" fill="#8A93A3"/><circle cx="130" cy="28" r="7" fill="#C9D0DB"/>
<path d="M130 30 Q100 10 72 50 Q60 70 66 92" stroke="#2A2F38" stroke-width="5" fill="none"/>
<path d="M40 96 Q40 74 66 72 Q92 74 92 96 Q92 128 66 134 Q40 128 40 96 Z" fill="#3A3F4B"/><path d="M48 98 Q48 82 66 80 Q84 82 84 98 Q84 120 66 124 Q48 120 48 98 Z" fill="#5C6370"/>
<path d="M36 88 L20 80 M96 88 L112 80" stroke="#2A2A2E" stroke-width="4"/><circle cx="66" cy="104" r="7" fill="#2A2A2E"/>`,
ladder:`<ellipse cx="100" cy="176" rx="84" ry="10" fill="#E9EEF5"/><path d="M60 172 Q100 156 140 172 Q100 190 60 172" fill="#7FB0E0"/>
<g transform="rotate(-18 100 100)"><rect x="70" y="20" width="9" height="160" rx="3" fill="#C9D0DB"/><rect x="121" y="20" width="9" height="160" rx="3" fill="#AEB6C2"/>${[34,58,82,106,130,154].map(y=>`<rect x="70" y="${y}" width="60" height="7" rx="3" fill="#C9D0DB"/>`).join('')}</g>`,
tent:`<ellipse cx="100" cy="164" rx="90" ry="16" fill="#E9EEF5"/>
<path d="M20 160 Q40 70 100 64 Q160 70 180 160 Z" fill="#FF9E4A"/><path d="M100 64 Q160 70 180 160 L136 160 Q132 96 100 64" fill="#E5873A"/>
<path d="M54 160 Q70 92 100 88 Q130 92 146 160" stroke="#D97B2E" stroke-width="3" fill="none"/><path d="M80 160 Q86 116 100 112 Q114 116 120 160 Z" fill="#2A2F38"/>
<path d="M20 160 L6 120 M180 160 L194 120 M100 64 L100 40" stroke="#C9D0DB" stroke-width="2"/>`,
gloves:`<ellipse cx="100" cy="182" rx="56" ry="7" fill="#000" opacity=".28"/>
<path d="M62 176 L62 110 Q60 60 92 54 Q126 52 132 90 L134 120 Q150 104 160 114 Q166 124 150 140 L136 176 Z" fill="#E35D5D"/>
<path d="M62 176 L62 110 Q60 60 92 54 Q78 80 80 176 Z" fill="#C94848"/><rect x="56" y="150" width="86" height="30" rx="10" fill="#2A2F38"/><g stroke="#3A3F4B" stroke-width="3"><line x1="70" y1="152" x2="70" y2="178"/><line x1="86" y1="152" x2="86" y2="178"/><line x1="102" y1="152" x2="102" y2="178"/><line x1="118" y1="152" x2="118" y2="178"/></g>
<path d="M80 74 Q88 62 104 60" stroke="#fff" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/>`,
torch:`<ellipse cx="100" cy="170" rx="66" ry="7" fill="#000" opacity=".28"/>
<polygon points="122,92 196,60 196,140" fill="#FAEEDA" opacity=".35"/>
<ellipse cx="88" cy="110" rx="62" ry="40" fill="none" stroke="#2A2F38" stroke-width="12"/><ellipse cx="88" cy="110" rx="62" ry="40" fill="none" stroke="#5EA2FF" stroke-width="4" stroke-dasharray="10 8"/>
<rect x="96" y="80" width="40" height="40" rx="10" fill="#3A3F4B"/><circle cx="122" cy="100" r="14" fill="#FAEEDA"/><circle cx="122" cy="100" r="8" fill="#fff"/>`,
suit8000:`<ellipse cx="100" cy="188" rx="60" ry="6" fill="#000" opacity=".28"/>
<path d="M64 40 L86 32 Q100 40 114 32 L136 40 L162 104 L144 112 L136 88 L138 130 L132 182 L108 182 L100 132 L92 182 L68 182 L62 130 L64 88 L56 112 L38 104 Z" fill="#F2C14E"/>
<path d="M64 40 L86 32 Q92 38 100 40 L100 132 L92 182 L68 182 L62 130 L64 88 L56 112 L38 104 Z" fill="#000" opacity=".1"/>
<path d="M62 120 L138 120 L138 132 L62 132 Z" fill="#2A2A2E"/><path d="M38 104 L56 112 L52 120 L34 112 Z M162 104 L144 112 L148 120 L166 112 Z" fill="#2A2A2E"/>
<g stroke="#D9A72E" stroke-width="2.2" fill="none"><path d="M64 62 Q100 68 136 62"/><path d="M64 86 Q100 92 136 86"/><path d="M66 150 L94 152 M106 152 L134 150"/></g><line x1="100" y1="40" x2="100" y2="120" stroke="#2A2A2E" stroke-width="3"/>`,
badge14:`<ellipse cx="100" cy="184" rx="52" ry="6" fill="#000" opacity=".28"/>
<polygon points="70,120 88,120 82,182 70,172 58,180" fill="#1B1B1B"/><polygon points="112,120 130,120 142,180 130,172 118,182" fill="#F2C14E"/>
<polygon points="100,26 154,56 154,128 100,158 46,128 46,56" fill="#B8862A"/><polygon points="100,36 146,62 146,122 100,148 54,122 54,62" fill="#1B1B1B"/>
<path d="M66 124 L92 80 L104 98 L114 86 L138 124 Z" fill="#F2C14E"/><text x="100" y="78" text-anchor="middle" font-size="28" font-weight="800" fill="#F2C14E" font-family="Inter,system-ui">14</text>`
};
const GEAR_KEYS = ['boots', 'backpack', 'poles', 'axe', 'jacket', 'helmet', 'flag', 'hat', 'rope', 'polarsuit', 'beanie', 'badge7', 'prayer', 'bivouac', 'glasses', 'karakoram', 'annapurna', 'techaxe', 'oxygen', 'ladder', 'tent', 'gloves', 'torch', 'suit8000', 'badge14'];
const gearSVG = (i, size) => `<svg viewBox="0 0 200 200" width="${size || '100%'}" ${size ? `height="${size}"` : ''} aria-hidden="true">${GEAR_ART[GEAR_KEYS[i]] || ''}</svg>`;
