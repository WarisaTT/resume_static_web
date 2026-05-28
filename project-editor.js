const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup image upload storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = path.join(__dirname, 'assets/images/project_images');
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, safeName);
    }
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static project files so they can access assets and see previews
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(__dirname, { index: false }));

const DATA_FILE = path.join(__dirname, 'website-data.json');
const INDEX_HTML = path.join(__dirname, 'index.html');
const TH_HTML = path.join(__dirname, 'th.html');

// Helper to read site data
function getSiteData() {
    if (!fs.existsSync(DATA_FILE)) {
        return {
            profile: {}, projects: [], experience: [], certifications: [], polaroid_strip: [], contact: {}, skills: []
        };
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// Helper to save site data and rebuild both HTML files
function saveSiteData(data) {
    // Safety merge: read existing data so contact fields are never lost
    const existing = getSiteData();

    // If incoming contact field is blank but existing has a value, keep existing
    if (existing.contact) {
        const contactFields = [
            'email', 'phone', 'address_th', 'address_en',
            'postcard_title_th', 'postcard_title_en',
            'postcard_text_th', 'postcard_text_en'
        ];
        if (!data.contact) data.contact = {};
        contactFields.forEach(field => {
            if (!data.contact[field] && existing.contact[field]) {
                data.contact[field] = existing.contact[field];
            }
        });
    }

    // Write JSON source of truth
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');

    // Build English layout
    const englishHTMLs = {
        hero: generateHeroHTML(data.profile, false),
        about: generateAboutHTML(data.profile, false),
        timeline: generateTimelineHTML(data.experience, false),
        projects: generateProjectsHTML(data.projects, false),
        skills: generateSkillsHTML(data.skills, false),
        certs: generateCertsHTML(data.certifications, data.polaroid_strip, false),
        contact: generateContactHTML(data.contact, false)
    };
    rebuildHTMLFile(INDEX_HTML, englishHTMLs);

    // Build Thai layout
    const thaiHTMLs = {
        hero: generateHeroHTML(data.profile, true),
        about: generateAboutHTML(data.profile, true),
        timeline: generateTimelineHTML(data.experience, true),
        projects: generateProjectsHTML(data.projects, true),
        skills: generateSkillsHTML(data.skills, true),
        certs: generateCertsHTML(data.certifications, data.polaroid_strip, true),
        contact: generateContactHTML(data.contact, true)
    };
    rebuildHTMLFile(TH_HTML, thaiHTMLs);
}

// ==================== HTML Templates Generators ====================

function generateHeroHTML(profile, isThai) {
    const status = isThai ? profile.status_th : profile.status_en;
    const firstName = isThai ? profile.first_name_th : profile.first_name_en;
    const lastName = isThai ? profile.last_name_th : profile.last_name_en;
    const subtitle = isThai ? profile.subtitle_th : profile.subtitle_en;
    const cvLink = isThai ? profile.cv_link_th : profile.cv_link_en;
    const workBtnText = isThai ? 'ดูผลงาน' : 'See my Work';
    const cvBtnText = isThai ? 'ดาวน์โหลด CV' : 'Download CV';
    const iBuiltText = isThai ? 'ฉันสร้าง' : 'I build';

    const cap1 = isThai ? (profile.hero_caption_1_th || '') : (profile.hero_caption_1_en || '');
    const cap2 = isThai ? (profile.hero_caption_2_th || '') : (profile.hero_caption_2_en || '');
    const cap3 = isThai ? (profile.hero_caption_3_th || '') : (profile.hero_caption_3_en || '');
    const img1 = profile.hero_img_1 || '';
    const img2 = profile.hero_img_2 || '';
    const img3 = profile.hero_img_3 || '';
    const tape1 = profile.hero_tape_1 || 'tape-pink';
    const tape2 = profile.hero_tape_2 || 'tape-green';
    const tape3 = profile.hero_tape_3 || 'tape-yellow';

    // For Thai version, name on one line (no <br>)
    const nameHTML = isThai
        ? `${firstName} <span style="color: var(--primary-light)">${lastName}</span>`
        : `${firstName} <br><span style="color: var(--primary-light)">${lastName}</span>`;

    return `            <div class="hero-content">
                <div class="status-badge">
                    <i class="fas fa-circle" style="font-size: 0.5rem; animation: pulse-dot 1.5s ease-in-out infinite;"></i>
                    ${status}
                </div>
                <h1>${nameHTML}</h1>
                <div class="hero-role-line" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                    <span style="color: var(--text-muted); font-size: 1.1rem; font-weight: 500;">${iBuiltText}</span>
                    <span id="hero-typing" style="color: var(--primary-light); font-size: 1.2rem; font-weight: 700; min-width: 180px;"></span>
                </div>
                <p>${subtitle}</p>
                <div class="hero-tags" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 2.5rem;">
                    <span class="hero-tag"><i class="fab fa-python"></i> Python</span>
                    <span class="hero-tag"><i class="fab fa-react"></i> React</span>
                    <span class="hero-tag"><i class="fab fa-node-js"></i> Node.js</span>
                    <span class="hero-tag"><i class="fas fa-brain"></i> AI/ML</span>
                    <span class="hero-tag"><i class="fas fa-infinity"></i> CI/CD</span>
                </div>
                <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
                    <div class="hero-actions" style="display: flex; gap: 1rem;">
                        <a href="#projects" class="btn btn-primary">${workBtnText}</a>
                        <a href="${cvLink}" class="btn btn-outline" download="${(cvLink || '').split('/').pop()}" target="_blank">${cvBtnText}</a>
                    </div>
                    <div style="display: flex; gap: 0.75rem;">
                        <a href="https://github.com/WarisaTT" target="_blank" class="hero-social-btn"><i class="fab fa-github"></i></a>
                        <a href="https://www.linkedin.com/in/warisa-thiamthong/" target="_blank" class="hero-social-btn"><i class="fab fa-linkedin-in"></i></a>
                    </div>
                </div>
            </div>

            <!-- Hero Polaroid Collage -->
            <div class="hero-image" style="flex: 0 0 auto; position: relative; width: 440px; height: 440px;">
                <!-- Polaroid 1 — back left -->
                <div class="scrapbook-polaroid" style="position: absolute; left: 0; top: 50px; width: 230px; transform: rotate(-6deg); z-index: 1; background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: 4px; padding: 12px; box-shadow: var(--card-shadow);">
                    <div class="washi-tape ${tape1}" style="top:-13px; left:25%; transform:rotate(2deg);"></div>
                    <div style="width:100%; aspect-ratio:4/5; overflow:hidden; border-radius:2px; margin-bottom:8px;">
                        <img src="assets/images/${img1}" alt="${cap1}" style="width:100%;height:100%;object-fit:cover;">
                    </div>
                    <p style="font-family:'Caveat','Mali','Itim',cursive; font-size:1.1rem; text-align:center; color:var(--text-gray); margin:0;">${cap1}</p>
                </div>
                <!-- Polaroid 2 — front center -->
                <div class="scrapbook-polaroid" style="position: absolute; left: 105px; top: 0; width: 250px; transform: rotate(3deg); z-index: 3; background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: 4px; padding: 14px; box-shadow: var(--card-shadow);">
                    <div class="washi-tape ${tape2}" style="top:-13px; left:30%; transform:rotate(-3deg);"></div>
                    <div style="width:100%; aspect-ratio:4/5; overflow:hidden; border-radius:2px; margin-bottom:10px;">
                        <img src="assets/images/${img2}" alt="${cap2}" style="width:100%;height:100%;object-fit:cover;">
                    </div>
                    <p style="font-family:'Caveat','Mali','Itim',cursive; font-size:1.2rem; text-align:center; color:var(--text-gray); margin:0;">${cap2}</p>
                </div>
                <!-- Polaroid 3 — back right -->
                <div class="scrapbook-polaroid" style="position: absolute; right: 0; top: 75px; width: 215px; transform: rotate(7deg); z-index: 2; background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: 4px; padding: 12px; box-shadow: var(--card-shadow);">
                    <div class="washi-tape ${tape3}" style="top:-13px; left:20%; transform:rotate(4deg);"></div>
                    <div style="width:100%; aspect-ratio:4/5; overflow:hidden; border-radius:2px; margin-bottom:8px;">
                        <img src="assets/images/${img3}" alt="${cap3}" style="width:100%;height:100%;object-fit:cover;">
                    </div>
                    <p style="font-family:'Caveat','Mali','Itim',cursive; font-size:1.1rem; text-align:center; color:var(--text-gray); margin:0;">${cap3}</p>
                </div>
            </div>`;
}

function generateAboutHTML(profile, isThai) {
    const title = isThai ? profile.about_title_th : profile.about_title_en;
    const text = isThai ? profile.about_text_th : profile.about_text_en;
    const caption = isThai ? profile.about_caption_th : profile.about_caption_en;
    
    const stats_edu_lbl = isThai ? 'การศึกษา' : 'Education';
    const stats_proj_lbl = isThai ? 'โปรเจกต์' : 'Projects Done';
    const stats_tech_lbl = isThai ? 'เน้นเทคโนโลยี' : 'Tech Focus';

    return `        <h2 class="section-title">${title}</h2>
        <div style="display: flex; gap: 4rem; align-items: center; justify-content: center; flex-wrap: wrap; margin-top: 2rem;">
            <!-- Left: Text content -->
            <div style="flex: 1.2; min-width: 320px;">
                <p style="font-size: 1.2rem; color: var(--text-gray); line-height: 1.8; margin-bottom: 2.5rem;">
                    ${text}
                </p>
                <div style="display: flex; gap: 2rem; justify-content: flex-start; flex-wrap: wrap;">
                    <div style="padding: 0.5rem 1rem; border-left: 3px dashed var(--primary-light);">
                        <h3 style="font-size: 2.2rem; color: var(--primary-light); margin-bottom: 0.2rem;">KMUTT</h3>
                        <p style="text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1.5px; color: var(--text-muted);">${stats_edu_lbl}</p>
                    </div>
                    <div style="padding: 0.5rem 1rem; border-left: 3px dashed var(--primary-light);">
                        <h3 style="font-size: 2.2rem; color: var(--primary-light); margin-bottom: 0.2rem;">6+</h3>
                        <p style="text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1.5px; color: var(--text-muted);">${stats_proj_lbl}</p>
                    </div>
                    <div style="padding: 0.5rem 1rem; border-left: 3px dashed var(--primary-light);">
                        <h3 style="font-size: 2.2rem; color: var(--primary-light); margin-bottom: 0.2rem;">AI</h3>
                        <p style="text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1.5px; color: var(--text-muted);">${stats_tech_lbl}</p>
                    </div>
                </div>
            </div>
            <!-- Right: Beautiful Polaroid -->
            <div style="flex: 0.8; min-width: 280px; display: flex; justify-content: center; position: relative;">
                <div class="scrapbook-polaroid" style="position: relative; width: 100%; max-width: 290px; transform: rotate(-2deg); box-shadow: var(--card-shadow); border: 1px solid var(--glass-border); background: var(--bg-card); padding: 14px; border-radius: 4px; z-index: 2;">
                    <div class="washi-tape tape-green" style="top: -15px; left: 30%; transform: rotate(3deg); opacity: 0.9;"></div>
                    <div style="width: 100%; aspect-ratio: 4/5; overflow: hidden; border-radius: 2px; margin-bottom: 12px; border: 1px solid rgba(0,0,0,0.04);">
                        <img src="assets/images/${profile.about_img}" alt="${caption}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <p style="font-family: 'Caveat', 'Mali', 'Itim', cursive; font-size: 1.5rem; text-align: center; color: var(--text-gray); margin: 0;">${caption}</p>
                </div>
            </div>
        </div>`;
}

function generateTimelineHTML(experience, isThai) {
    return experience.map(item => {
        const title = isThai ? item.title_th : item.title_en;
        const subtitle = isThai ? item.subtitle_th : item.subtitle_en;
        const date = isThai ? item.date_th : item.date_en;
        const desc = isThai ? item.description_th : item.description_en;
        const bullets = isThai ? item.bullets_th : item.bullets_en;

        let detailsHTML = '';
        if (bullets && bullets.length > 0) {
            const listItems = bullets.map(b => `                        <li>${b}</li>`).join('\n');
            detailsHTML = `                    <ul style="margin-left: 1.5rem; color: var(--text-gray); font-size: 0.95rem;">\n${listItems}\n                    </ul>`;
        } else if (desc) {
            detailsHTML = `                    <p style="color: var(--text-gray);">${desc}</p>`;
        }

        return `            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="glass-card">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; align-items: flex-start;">
                        <div>
                            <h3 style="color: var(--primary-light)">${title}</h3>
                            <h4 style="margin-top: 5px;">${subtitle}</h4>
                        </div>
                        <span style="color: var(--text-muted)">${date}</span>
                    </div>
${detailsHTML}
                </div>
            </div>`;
    }).join('\n\n');
}

function generateProjectsHTML(projects, isThai) {
    return projects.map(p => {
        const imagesStr = p.images.join(',');
        const title = isThai ? p.title_th : p.title_en;
        const desc = isThai ? p.desc_th : p.desc_en;
        const category = isThai ? p.category_th : p.category_en;
        const readme = isThai ? p.readme_th : p.readme_en;
        
        const readmeEscaped = readme.replace(/"/g, '&quot;');
        const categoryEscaped = category.replace(/"/g, '&quot;');
        
        const repoAttr = p.repo ? ` data-repo="${p.repo}"` : ' data-repo=""';
        const otherLinkAttr = ` data-other-link="${p.other_link || ''}" data-other-link-label-th="${p.other_link_label_th || ''}" data-other-link-label-en="${p.other_link_label_en || ''}"`;
        
        const imageTag = p.images[0] ? `<img src="assets/images/project_images/${p.images[0]}" alt="${title}">` : '';
        
        let categoryTag = '';
        if (category) {
            const colorVar = category === 'AI INTEGRATED' ? 'var(--accent)' : (category === 'INDUSTRIAL' ? 'var(--text-gray)' : 'var(--primary-light)');
            categoryTag = `<span style="font-size: 0.7rem; color: ${colorVar}; font-weight: 800; letter-spacing: 1px; margin-bottom: 1rem; display: block;">${category}</span>`;
        }

        const bullets = isThai ? p.bullets_th : p.bullets_en;
        const bulletsHTML = bullets.map(b => `                    <li>${b}</li>`).join('\n');
        const tagsHTML = p.tags.map(t => `<span class="tag">${t}</span>`).join(' ');
        
        let linksHTML = '<div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">';
        if (p.repo) {
            linksHTML += `                <a href="${p.repo}" target="_blank" style="display: inline-block; color: var(--primary-light); text-decoration: none; font-weight: 600;"><i class="fab fa-github"></i> GitHub Repo</a>`;
        }
        if (p.other_link) {
            const otherLabel = isThai ? (p.other_link_label_th || 'ดูรายละเอียด') : (p.other_link_label_en || 'View Link');
            
            // Auto detect icon
            let iconClass = 'fas fa-external-link-alt';
            const url = p.other_link.toLowerCase();
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                iconClass = 'fab fa-youtube';
            } else if (url.includes('play.google.com') || url.includes('apps.apple.com')) {
                iconClass = 'fas fa-mobile-alt';
            } else if (url.includes('figma.com')) {
                iconClass = 'fab fa-figma';
            }
            linksHTML += `                <a href="${p.other_link}" target="_blank" style="display: inline-block; color: var(--accent); text-decoration: none; font-weight: 600;"><i class="${iconClass}"></i> ${otherLabel}</a>`;
        }
        linksHTML += '</div>';

        return `            <div class="glass-card project-card" data-images="${imagesStr}" data-readme="${readmeEscaped}" data-category="${categoryEscaped}"${repoAttr}${otherLinkAttr}>
                <div class="project-image-wrapper">
                    ${imageTag}
                </div>
                ${categoryTag}
                <h3>${title}</h3>
                <p class="project-desc">${desc}</p>
                <ul style="margin: 1rem 0; margin-left: 1.2rem; color: var(--text-gray); font-size: 0.85rem;">
${bulletsHTML}
                </ul>
                <div class="tech-tags">
                    ${tagsHTML}
                </div>
${linksHTML}
            </div>`;
    }).join('\n\n');
}

function generateSkillsHTML(skills, isThai) {
    const secTitle = isThai ? 'ทักษะทางเทคนิค' : 'Technical Skills';
    if (!skills || skills.length === 0) return ``;

    const categoriesHTML = skills.map(cat => {
        const title = isThai ? cat.title_th : cat.title_en;
        const itemsHTML = cat.items.map(item => {
            const name = isThai ? item.name_th : item.name_en;
            const colorStyle = item.color ? ` style="color: ${item.color}"` : '';
            const iconHTML = item.icon ? `<i class="${item.icon}"${colorStyle}></i> ` : '';
            return `                    <span class="sub-tag">${iconHTML}${name}</span>`;
        }).join('\n');

        return `            <div class="glass-card">
                <div class="category-header">
                    <i class="fas ${cat.icon}"></i>
                    <h3>${title}</h3>
                </div>
                <div class="sub-skills">
${itemsHTML}
                </div>
            </div>`;
    }).join('\n\n');

    return `    <section id="skills" class="container reveal">
        <h2 class="section-title">${secTitle}</h2>
        <div class="skills-grid-detailed">
${categoriesHTML}
        </div>
    </section>`;
}

function generateCertsHTML(certs, strip, isThai) {
    const certCards = certs.map(c => {
        const title = isThai ? c.title_th : c.title_en;
        const desc = isThai ? c.desc_th : c.desc_en;
        const icon = c.title_en.includes('Educator') ? 'fa-graduation-cap' : 'fa-certificate';

        return `            <div class="glass-card" style="padding: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <i class="fas ${icon}" style="font-size: 1.5rem; color: var(--primary-light);"></i>
                    <h3 style="font-size: 1.1rem; margin: 0;">${title}</h3>
                </div>
                <div style="width: 100%; overflow: hidden; border-radius: 12px; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.2); margin-bottom: 1rem;">
                    <img src="assets/images/${c.img}" alt="${title}" style="width: 100%; height: auto; display: block;">
                </div>
                <p style="font-size: 0.9rem; color: var(--text-muted);">${desc}</p>
            </div>`;
    }).join('\n');

    const stripCards = strip.map(p => {
        const caption = isThai ? p.caption_th : p.caption_en;
        return `                    <!-- Polaroid -->
                    <div class="scrapbook-polaroid" style="position: relative; width: 100%; max-width: 210px; transform: rotate(${p.rotate}); box-shadow: var(--card-shadow); border: 1px solid var(--glass-border); background: var(--bg-card); padding: 12px; border-radius: 4px; transition: all 0.3s ease;">
                        <div class="washi-tape ${p.tape}" style="top: -12px; left: 30%; transform: rotate(${p.rotate}); width: 80px; height: 24px;"></div>
                        <div style="width: 100%; aspect-ratio: 1/1; overflow: hidden; border-radius: 2px; margin-bottom: 8px;">
                            <img src="assets/images/${p.img}" alt="${caption}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <p style="font-family: 'Caveat', 'Mali', 'Itim', cursive; font-size: 1.2rem; text-align: center; color: var(--text-gray); margin: 0;">${caption}</p>
                    </div>`;
    }).join('\n');

    const stripCardWrapper = `            <div class="glass-card" style="padding: 2.5rem; display: flex; flex-direction: column; justify-content: center; align-items: center; border-style: dashed; border-color: var(--primary-light);">
                <div style="display: flex; gap: 2.5rem; justify-content: center; align-items: center; flex-wrap: wrap; width: 100%;">
${stripCards}
                </div>
            </div>`;

    return certCards + '\n' + stripCardWrapper;
}

function generateContactHTML(contact, isThai) {
    const emailLbl = isThai ? 'อีเมล' : 'Email';
    const phoneLbl = isThai ? 'เบอร์โทรศัพท์' : 'Phone';
    const addressLbl = isThai ? 'ที่อยู่' : 'Location';
    const addressVal = isThai ? contact.address_th : contact.address_en;
    const title = isThai ? contact.postcard_title_th : contact.postcard_title_en;
    const text = isThai ? contact.postcard_text_th : contact.postcard_text_en;
    const btnText = isThai ? 'ส่งข้อความ' : 'Send Email';

    return `            <!-- Left Side of Postcard: Written Contact details -->
            <div class="postcard-message">
                <div class="contact-card">
                    <div class="icon-box"><i class="fas fa-envelope"></i></div>
                    <div>
                        <p class="postcard-label">${emailLbl}</p>
                        <p class="postcard-value">${contact.email}</p>
                    </div>
                </div>
                <div class="contact-card">
                    <div class="icon-box"><i class="fas fa-phone"></i></div>
                    <div>
                        <p class="postcard-label">${phoneLbl}</p>
                        <p class="postcard-value">${contact.phone}</p>
                    </div>
                </div>
                <div class="contact-card">
                    <div class="icon-box"><i class="fas fa-location-dot"></i></div>
                    <div>
                        <p class="postcard-label">${addressLbl}</p>
                        <p class="postcard-value">${addressVal}</p>
                    </div>
                </div>
            </div>
            <!-- Vertical divider line -->
            <div class="postcard-divider"></div>
            <!-- Right Side of Postcard: Stamp & Invitation -->
            <div class="postcard-address">
                <div class="postcard-stamp-wrapper">
                    <!-- Postmark stamp -->
                    <div class="postmark-seal">WARISA.TT</div>
                    <!-- Photo stamp -->
                    <div class="postcard-stamp">
                        <img src="assets/images/D6DF40E2-F0D4-4B12-97FA-8A5ADE73D396.JPG" alt="Postage Stamp">
                    </div>
                </div>
                <div class="postcard-writing">
                    <h3 class="postcard-title">${title}</h3>
                    <p class="postcard-text">${text}</p>
                    <a href="mailto:${contact.email}" class="btn btn-primary postcard-btn">${btnText}</a>
                </div>
            </div>`;
}

// In-place HTML file builder replacing multiple bounded sections
function rebuildHTMLFile(filePath, htmlBlocks) {
    let content = fs.readFileSync(filePath, 'utf8');

    const sections = ['HERO', 'ABOUT', 'TIMELINE', 'PROJECTS', 'SKILLS', 'CERTS', 'CONTACT'];
    
    sections.forEach(sec => {
        const startTag = `<!-- ${sec}_START -->`;
        const endTag = `<!-- ${sec}_END -->`;
        
        const startIndex = content.indexOf(startTag);
        const endIndex = content.indexOf(endTag);
        
        if (startIndex !== -1 && endIndex !== -1) {
            const before = content.substring(0, startIndex + startTag.length);
            const after = content.substring(endIndex);
            
            let key = sec.toLowerCase();
            content = before + '\n' + htmlBlocks[key] + '\n' + after;
        }
    });

    fs.writeFileSync(filePath, content, 'utf8');
}

// ==================== API Routes ====================

app.get('/api/site-data', (req, res) => {
    res.json(getSiteData());
});

app.post('/api/site-data', (req, res) => {
    saveSiteData(req.body);
    res.json({ success: true });
});

app.post('/api/upload', upload.array('photos'), (req, res) => {
    const filenames = req.files.map(file => file.filename);
    res.json({ success: true, filenames });
});

app.get('/api/available-images', (req, res) => {
    const dirs = [
        path.join(__dirname, 'assets/images'),
        path.join(__dirname, 'assets/images/project_images')
    ];
    let allFiles = [];
    
    dirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir).filter(file => {
                return ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(path.extname(file).toLowerCase());
            });
            allFiles = [...allFiles, ...files];
        }
    });
    // Remove duplicates
    res.json([...new Set(allFiles)]);
});

// Admin UI Page
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warisa Portfolio CMS Dashboard 🎨</title>
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Mali:wght@400;600;700&family=Itim&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script>
        // Force theme sync with local storage
        let theme = 'dark';
        try {
            theme = localStorage.getItem('theme') || 'dark';
        } catch(e) {}
        document.documentElement.setAttribute('data-theme', theme);
    </script>
    <style>
        :root {
            --primary: #7c3aed;
            --primary-light: #9f75ff;
            --bg-main: #FAF6ED;
            --bg-card: #FFFFFF;
            --text-gray: #4b5563;
            --text-dark: #1e1b4b;
            --accent: #F59E0B;
            --glass-border: rgba(124, 58, 237, 0.12);
            --card-shadow: 0 10px 25px rgba(120, 110, 90, 0.08);
        }

        [data-theme="dark"] {
            --primary: #c4b5fd;
            --primary-light: #ddd6fe;
            --bg-main: #18181B;
            --bg-card: #27272A;
            --text-gray: #E4E4E7;
            --text-dark: #FAFAFA;
            --accent: #FBBF24;
            --glass-border: rgba(255, 255, 255, 0.08);
            --card-shadow: 0 10px 30px rgba(0,0,0,0.4);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Mali', 'Outfit', sans-serif;
            background-color: var(--bg-main);
            color: var(--text-gray);
            background-image: 
                radial-gradient(rgba(124, 58, 237, 0.02) 1px, transparent 0),
                linear-gradient(to right, rgba(124, 58, 237, 0.015) 1px, transparent 1px);
            background-size: 24px 24px, 48px 48px;
            padding: 3rem 1.5rem;
            line-height: 1.6;
        }

        /* Cards & Grid */
        section {
            padding: 90px 0;
            clear: both;
        }

        .section-title {
            font-size: 2.5rem;
            margin: 0 0 3rem 0;
            text-align: center;
            position: relative;
            z-index: 10;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 2rem;
            position: relative;
        }

        .main-title {
            font-family: 'Caveat', cursive;
            font-size: 3.8rem;
            color: var(--primary);
            margin-bottom: 0.5rem;
            display: inline-block;
            position: relative;
        }

        .main-title::after {
            content: '';
            position: absolute;
            bottom: 0px;
            left: 5%;
            width: 90%;
            height: 4px;
            background: var(--accent);
            border-radius: 50% 20% 40% 10%;
            opacity: 0.8;
        }

        .subtitle {
            font-size: 1.1rem;
            color: var(--text-gray);
        }

        /* Tabs Menu */
        .tab-menu {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 3rem;
            border-bottom: 2px dashed var(--glass-border);
            padding-bottom: 1rem;
            flex-wrap: wrap;
        }

        .tab-btn {
            background: var(--bg-card);
            border: 1px solid var(--glass-border);
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-family: inherit;
            font-weight: 700;
            color: var(--text-gray);
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 4px 10px rgba(120, 110, 90, 0.05);
        }

        .tab-btn:hover {
            transform: translateY(-2px);
            border-color: var(--primary);
            color: var(--primary);
        }

        .tab-btn.active {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
            box-shadow: 0 8px 20px rgba(124, 58, 237, 0.25);
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        /* Polaroid Row Grid */
        .project-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }

        /* Polaroid Card */
        .polaroid-card {
            background: var(--bg-card);
            border: 1px solid var(--glass-border);
            padding: 1rem 1rem 1.5rem 1rem;
            border-radius: 4px;
            box-shadow: var(--card-shadow);
            position: relative;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex;
            flex-direction: column;
        }

        .polaroid-card:hover {
            transform: translateY(-8px) rotate(1deg);
            box-shadow: 0 15px 30px rgba(120, 110, 90, 0.15);
        }

        .polaroid-card.tilted-left { transform: rotate(-1.5deg); }
        .polaroid-card.tilted-right { transform: rotate(1.5deg); }

        .tape {
            position: absolute;
            top: -12px;
            left: 35%;
            width: 70px;
            height: 20px;
            background: rgba(167, 243, 208, 0.8);
            transform: rotate(-3deg);
            z-index: 10;
        }
        .tape-pink { background: rgba(253, 218, 218, 0.8); }
        .tape-yellow { background: rgba(254, 243, 199, 0.8); }

        .polaroid-img {
            width: 100%;
            aspect-ratio: 16/10;
            object-fit: cover;
            border: 1px solid rgba(0,0,0,0.05);
            border-radius: 2px;
            margin-bottom: 1rem;
        }

        .proj-cat {
            font-size: 0.7rem;
            font-weight: 700;
            color: var(--primary-light);
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 0.5rem;
        }

        .polaroid-card h3 {
            font-size: 1.25rem;
            color: var(--text-dark);
            margin-bottom: 0.4rem;
        }

        .proj-desc {
            font-size: 0.85rem;
            color: var(--text-gray);
            margin-bottom: 1rem;
            flex-grow: 1;
        }

        .proj-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
            margin-bottom: 1rem;
        }

        .tag-badge {
            font-size: 0.7rem;
            padding: 0.2rem 0.6rem;
            border-radius: 10px;
            background: var(--bg-main);
            border: 1px dashed var(--glass-border);
            color: var(--text-gray);
            font-weight: 600;
        }

        .card-actions {
            display: flex;
            gap: 0.5rem;
            margin-top: auto;
            border-top: 1px dashed var(--glass-border);
            padding-top: 1rem;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.4rem;
            padding: 0.6rem 1.2rem;
            border-radius: 8px;
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            border: none;
        }

        .btn-add {
            background: var(--primary);
            color: white;
            padding: 0.8rem 2rem;
            border-radius: 12px;
            font-size: 1rem;
            box-shadow: 0 4px 15px rgba(124, 58, 237, 0.2);
            margin-bottom: 1.5rem;
        }
        .btn-add:hover {
            background: var(--primary-light);
            transform: scale(1.05);
        }

        .btn-edit {
            background: rgba(124, 58, 237, 0.1);
            color: var(--primary);
            flex: 1;
        }
        .btn-edit:hover {
            background: var(--primary);
            color: white;
        }

        .btn-delete {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            padding: 0.6rem;
        }
        .btn-delete:hover {
            background: #ef4444;
            color: white;
        }

        .btn-global-save {
            background: var(--accent);
            color: var(--text-dark);
            font-size: 1.1rem;
            padding: 1rem 3rem;
            border-radius: 14px;
            box-shadow: 0 6px 20px rgba(245, 158, 11, 0.25);
            margin: 2rem auto;
            display: flex;
        }
        .btn-global-save:hover {
            background: #fbbf24;
            transform: scale(1.03) translateY(-2px);
        }

        /* Forms Styling */
        .scrapbook-paper {
            background: var(--bg-card);
            border: 1px solid var(--glass-border);
            padding: 2.5rem;
            border-radius: 16px;
            box-shadow: var(--card-shadow);
            margin-bottom: 2rem;
            position: relative;
        }

        .scrapbook-paper::before {
            content: '';
            position: absolute;
            top: 0;
            left: 20px;
            width: 2px;
            height: 100%;
            background: rgba(239, 68, 68, 0.15); /* Ruled paper margin line */
        }

        .section-header {
            font-family: 'Caveat', cursive;
            font-size: 2.5rem;
            color: var(--primary);
            margin-bottom: 1.5rem;
            padding-left: 1.5rem;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
            margin-bottom: 1.5rem;
            padding-left: 1.5rem;
        }

        .form-group {
            margin-bottom: 1.5rem;
            display: flex;
            flex-direction: column;
            padding-left: 1.5rem;
        }
        .form-group.full-width {
            grid-column: 1 / -1;
        }

        label {
            font-weight: 700;
            font-size: 0.9rem;
            color: var(--text-dark);
            margin-bottom: 0.4rem;
        }

        input, textarea, select {
            padding: 0.75rem;
            border-radius: 8px;
            border: 1px solid var(--glass-border);
            font-family: inherit;
            font-size: 0.9rem;
            background: var(--bg-card);
            color: var(--text-dark);
            outline: none;
            transition: all 0.2s ease;
        }

        input:focus, textarea:focus, select:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }

        textarea {
            resize: vertical;
            min-height: 100px;
        }

        /* Image Picker Styles */
        .image-uploader {
            border: 2px dashed var(--primary-light);
            border-radius: 8px;
            padding: 1.5rem;
            text-align: center;
            background: rgba(124, 58, 237, 0.02);
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 1rem;
        }
        .image-uploader:hover {
            background: rgba(124, 58, 237, 0.05);
        }

        .image-picker-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 0.8rem;
            margin-top: 1rem;
            border: 1px solid var(--glass-border);
            padding: 1rem;
            border-radius: 8px;
            background: rgba(0,0,0,0.02);
            max-height: 250px;
            overflow-y: auto;
        }

        .image-thumb-card {
            position: relative;
            border-radius: 4px;
            overflow: hidden;
            border: 1px solid rgba(0,0,0,0.1);
            aspect-ratio: 1;
            cursor: pointer;
        }
        .image-thumb-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .image-thumb-card .overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(124, 58, 237, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            opacity: 0;
            transition: all 0.15s ease;
        }
        .image-thumb-card.selected .overlay {
            opacity: 1;
        }

        .image-thumb-card .badge {
            position: absolute;
            top: 4px;
            right: 4px;
            background: var(--accent);
            color: white;
            font-size: 0.65rem;
            font-weight: 700;
            padding: 0.15rem 0.35rem;
            border-radius: 4px;
            z-index: 5;
        }

        /* Editor Modal */
        .editor-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(30, 27, 75, 0.4);
            backdrop-filter: blur(8px);
            z-index: 100;
            display: flex;
            justify-content: flex-end;
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s ease;
        }

        .editor-modal.active {
            opacity: 1;
            pointer-events: all;
        }

        .modal-body {
            width: 100%;
            max-width: 680px;
            background: var(--bg-main);
            height: 100%;
            box-shadow: -10px 0 30px rgba(0, 0, 0, 0.15);
            padding: 2.5rem 2rem;
            overflow-y: auto;
            transform: translateX(100px);
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
        }

        .editor-modal.active .modal-body {
            transform: translateX(0);
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            border-bottom: 2px dashed var(--glass-border);
            padding-bottom: 1rem;
        }

        .modal-title {
            font-family: 'Caveat', cursive;
            font-size: 2.4rem;
            color: var(--primary);
        }

        .btn-close {
            background: transparent;
            border: none;
            font-size: 1.8rem;
            cursor: pointer;
            color: var(--text-gray);
        }

        .submit-bar {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
            border-top: 2px dashed var(--glass-border);
            padding-top: 1.5rem;
        }
        .btn-submit {
            background: var(--primary);
            color: white;
            flex: 2;
            padding: 0.8rem;
        }
        .btn-submit:hover { background: var(--primary-light); }
        .btn-cancel {
            background: #ef4444;
            color: white;
            flex: 1;
        }
        .btn-cancel:hover { background: #f87171; }

        .toast {
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: var(--text-dark);
            color: white;
            padding: 0.8rem 2rem;
            border-radius: 30px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            font-weight: 700;
            z-index: 1000;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            opacity: 0;
        }
        .toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }

        .selected-list {
            margin-top: 0.5rem;
            font-size: 0.8rem;
            color: var(--primary);
            font-weight: 700;
        }
    </style>
</head>
<body>
    <div class="container">
        <header style="display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
            <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme" style="position: absolute; right: 20px; top: 10px; background: var(--bg-card); border: 1px solid var(--glass-border); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; cursor: pointer; color: var(--primary); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: var(--card-shadow); z-index: 100;">
                <i class="fas fa-cloud-sun" id="sun-icon"></i>
                <i class="fas fa-moon" id="moon-icon" style="display: none;"></i>
            </button>
            <h1 class="main-title">Warisa Portfolio CMS Editor</h1>
            <p class="subtitle">ระบบจัดการและแก้ไขข้อมูลทุกส่วนของเว็บไซต์ด้วย UI ง่ายๆ 🎨✨</p>
        </header>

        <!-- Navigation Tabs -->
        <div class="tab-menu">
            <button class="tab-btn active" onclick="switchTab('profile-tab', this)"><i class="fas fa-user"></i> Profile & About</button>
            <button class="tab-btn" onclick="switchTab('projects-tab', this)"><i class="fas fa-folder-open"></i> Projects Portfolio</button>
            <button class="tab-btn" onclick="switchTab('timeline-tab', this)"><i class="fas fa-history"></i> Career Timeline</button>
            <button class="tab-btn" onclick="switchTab('certs-tab', this)"><i class="fas fa-graduation-cap"></i> Certifications</button>
            <button class="tab-btn" onclick="switchTab('skills-tab', this)"><i class="fas fa-star"></i> Technical Skills</button>
            <button class="tab-btn" onclick="switchTab('contact-tab', this)"><i class="fas fa-envelope"></i> Contact Postcard</button>
        </div>

        <!-- Master Save button -->
        <button class="btn btn-global-save" id="global-save-btn">
            <i class="fas fa-save"></i> บันทึกและประกอบเป็นเว็บจริง (Save & Build Website)
        </button>

        <!-- ==================== Tab Content: PROFILE ==================== -->
        <div class="tab-content active" id="profile-tab">
            <div class="scrapbook-paper">
                <h2 class="section-header">Hero Header Settings</h2>
                <div class="form-row">
                    <div class="form-group">
                        <label for="status_th">แท็กสถานะ (TH)</label>
                        <input type="text" id="status_th" placeholder="เช่น พร้อมรับโอกาสใหม่">
                    </div>
                    <div class="form-group">
                        <label for="status_en">Status Badge (EN)</label>
                        <input type="text" id="status_en" placeholder="e.g. Available for Opportunities">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="first_name_th">ชื่อจริง (TH)</label>
                        <input type="text" id="first_name_th" placeholder="เช่น วริษา">
                    </div>
                    <div class="form-group">
                        <label for="first_name_en">First Name (EN)</label>
                        <input type="text" id="first_name_en" placeholder="e.g. Warisa">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="last_name_th">นามสกุล (TH)</label>
                        <input type="text" id="last_name_th" placeholder="เช่น เทียมทอง">
                    </div>
                    <div class="form-group">
                        <label for="last_name_en">Last Name (EN)</label>
                        <input type="text" id="last_name_en" placeholder="e.g. Thiamthong">
                    </div>
                </div>
                <div class="form-group full-width">
                    <label for="subtitle_th">คำโปรย / สโลแกนใต้ชื่อ (TH)</label>
                    <textarea id="subtitle_th"></textarea>
                </div>
                <div class="form-group full-width">
                    <label for="subtitle_en">Slogan / Subtitle below name (EN)</label>
                    <textarea id="subtitle_en"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="cv_link_th">ลิงก์ดาวน์โหลด CV (TH)</label>
                        <input type="text" id="cv_link_th" placeholder="assets/pdf/Resume_Warisa_THA.pdf">
                    </div>
                    <div class="form-group">
                        <label for="cv_link_en">CV Download Link (EN)</label>
                        <input type="text" id="cv_link_en" placeholder="assets/pdf/Resume_Warisa_ENG.pdf">
                    </div>
                </div>

                <h3 style="margin: 2rem 0 1rem; font-size:1.1rem; color:var(--primary); border-top: 2px dashed var(--glass-border); padding-top:1.5rem;">
                    <i class="fas fa-images"></i> รูปโพลารอยด์ Hero (3 ใบ)
                </h3>

                <!-- Hero Polaroid 1 -->
                <div class="scrapbook-paper" style="margin-bottom:1.5rem; padding:1.2rem;">
                    <div style="display:flex; gap:1rem; align-items:center; margin-bottom:1rem;">
                        <div style="width:56px; height:56px; border-radius:4px; overflow:hidden; border:1px solid var(--glass-border); flex-shrink:0; background:rgba(0,0,0,0.1);">
                            <img id="hero-img-preview-1" src="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">
                        </div>
                        <div style="flex:1;">
                            <div style="font-weight:800; color:var(--primary); margin-bottom:0.3rem;">📌 รูปที่ 1 (ซ้าย — หลัง)</div>
                            <input type="text" id="hero_img_1" placeholder="ชื่อไฟล์ เช่น IMG_2376.PNG" style="width:100%; margin-bottom:0;" oninput="updateHeroPreview(1,this.value)">
                        </div>
                    </div>
                    <div class="image-picker-grid" id="hero-image-selector-1" style="max-height:180px;"></div>
                    <div class="form-row" style="margin-top:0.8rem; gap:1rem;">
                        <div class="form-group" style="margin-bottom:0; padding:0;">
                            <label>แคปชั่น (TH)</label>
                            <input type="text" id="hero_caption_1_th" placeholder="เช่น วริษา - Professional">
                        </div>
                        <div class="form-group" style="margin-bottom:0; padding:0;">
                            <label>Caption (EN)</label>
                            <input type="text" id="hero_caption_1_en" placeholder="e.g. Warisa - Professional">
                        </div>
                        <div class="form-group" style="margin-bottom:0; padding:0;">
                            <label>Washi Tape</label>
                            <select id="hero_tape_1">
                                <option value="tape-pink">🌸 สีชมพู</option>
                                <option value="tape-yellow">🌼 สีเหลือง</option>
                                <option value="tape-green">🌿 สีเขียว</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Hero Polaroid 2 -->
                <div class="scrapbook-paper" style="margin-bottom:1.5rem; padding:1.2rem;">
                    <div style="display:flex; gap:1rem; align-items:center; margin-bottom:1rem;">
                        <div style="width:56px; height:56px; border-radius:4px; overflow:hidden; border:1px solid var(--glass-border); flex-shrink:0; background:rgba(0,0,0,0.1);">
                            <img id="hero-img-preview-2" src="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">
                        </div>
                        <div style="flex:1;">
                            <div style="font-weight:800; color:var(--primary); margin-bottom:0.3rem;">📌 รูปที่ 2 (กลาง — หน้าสุด)</div>
                            <input type="text" id="hero_img_2" placeholder="ชื่อไฟล์ เช่น D6DF40E2.JPG" style="width:100%; margin-bottom:0;" oninput="updateHeroPreview(2,this.value)">
                        </div>
                    </div>
                    <div class="image-picker-grid" id="hero-image-selector-2" style="max-height:180px;"></div>
                    <div class="form-row" style="margin-top:0.8rem; gap:1rem;">
                        <div class="form-group" style="margin-bottom:0; padding:0;">
                            <label>แคปชั่น (TH)</label>
                            <input type="text" id="hero_caption_2_th" placeholder="เช่น วริษา - Casual">
                        </div>
                        <div class="form-group" style="margin-bottom:0; padding:0;">
                            <label>Caption (EN)</label>
                            <input type="text" id="hero_caption_2_en" placeholder="e.g. Warisa - Casual">
                        </div>
                        <div class="form-group" style="margin-bottom:0; padding:0;">
                            <label>Washi Tape</label>
                            <select id="hero_tape_2">
                                <option value="tape-pink">🌸 สีชมพู</option>
                                <option value="tape-yellow">🌼 สีเหลือง</option>
                                <option value="tape-green">🌿 สีเขียว</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Hero Polaroid 3 -->
                <div class="scrapbook-paper" style="padding:1.2rem;">
                    <div style="display:flex; gap:1rem; align-items:center; margin-bottom:1rem;">
                        <div style="width:56px; height:56px; border-radius:4px; overflow:hidden; border:1px solid var(--glass-border); flex-shrink:0; background:rgba(0,0,0,0.1);">
                            <img id="hero-img-preview-3" src="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">
                        </div>
                        <div style="flex:1;">
                            <div style="font-weight:800; color:var(--primary); margin-bottom:0.3rem;">📌 รูปที่ 3 (ขวา — หลัง)</div>
                            <input type="text" id="hero_img_3" placeholder="ชื่อไฟล์ เช่น CFD901D7.JPG" style="width:100%; margin-bottom:0;" oninput="updateHeroPreview(3,this.value)">
                        </div>
                    </div>
                    <div class="image-picker-grid" id="hero-image-selector-3" style="max-height:180px;"></div>
                    <div class="form-row" style="margin-top:0.8rem; gap:1rem;">
                        <div class="form-group" style="margin-bottom:0; padding:0;">
                            <label>แคปชั่น (TH)</label>
                            <input type="text" id="hero_caption_3_th" placeholder="เช่น วริษา - Outdoor">
                        </div>
                        <div class="form-group" style="margin-bottom:0; padding:0;">
                            <label>Caption (EN)</label>
                            <input type="text" id="hero_caption_3_en" placeholder="e.g. Warisa - Outdoor">
                        </div>
                        <div class="form-group" style="margin-bottom:0; padding:0;">
                            <label>Washi Tape</label>
                            <select id="hero_tape_3">
                                <option value="tape-pink">🌸 สีชมพู</option>
                                <option value="tape-yellow">🌼 สีเหลือง</option>
                                <option value="tape-green">🌿 สีเขียว</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="scrapbook-paper">
                <h2 class="section-header">About Me Settings</h2>
                <div class="form-row">
                    <div class="form-group">
                        <label for="about_title_th">หัวข้อเกี่ยวกับฉัน (TH)</label>
                        <input type="text" id="about_title_th" placeholder="เช่น เกี่ยวกับฉัน">
                    </div>
                    <div class="form-group">
                        <label for="about_title_en">About Me Section Title (EN)</label>
                        <input type="text" id="about_title_en" placeholder="e.g. About Me">
                    </div>
                </div>
                <div class="form-group full-width">
                    <label for="about_text_th">รายละเอียดเกี่ยวกับฉัน (TH)</label>
                    <textarea id="about_text_th" rows="6"></textarea>
                </div>
                <div class="form-group full-width">
                    <label for="about_text_en">About Me Description (EN)</label>
                    <textarea id="about_text_en" rows="6"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="about_caption_th">แคปชั่นรูปภาพโพลารอยด์เกี่ยวกับฉัน (TH)</label>
                        <input type="text" id="about_caption_th" placeholder="เช่น ค้นคว้าไอเดียใหม่ๆ">
                    </div>
                    <div class="form-group">
                        <label for="about_caption_en">Polaroid Image Caption (EN)</label>
                        <input type="text" id="about_caption_en" placeholder="e.g. Exploring ideas">
                    </div>
                </div>
                <div class="form-group full-width">
                    <label>เลือกรูปโพลารอยด์เกี่ยวกับฉัน</label>
                    <div class="image-picker-grid" id="about-image-selector">
                        <!-- Loaded dynamically -->
                    </div>
                </div>
            </div>
        </div>

        <!-- ==================== Tab Content: PROJECTS ==================== -->
        <div class="tab-content" id="projects-tab">
            <div style="display: flex; justify-content: center;">
                <button class="btn btn-add" onclick="openAddProjectModal()">
                    <i class="fas fa-plus"></i> เพิ่มโปรเจกต์ใหม่ (Add Project)
                </button>
            </div>
            <div class="project-grid" id="projects-list-container">
                <!-- Loaded dynamically -->
            </div>
        </div>

        <!-- ==================== Tab Content: TIMELINE ==================== -->
        <div class="tab-content" id="timeline-tab">
            <div style="display: flex; justify-content: center;">
                <button class="btn btn-add" onclick="openAddTimelineModal()">
                    <i class="fas fa-plus"></i> เพิ่มการศึกษา / ประสบการณ์ (Add Timeline Item)
                </button>
            </div>
            <div class="project-grid" id="timeline-list-container">
                <!-- Loaded dynamically -->
            </div>
        </div>

        <!-- ==================== Tab Content: CERTIFICATIONS ==================== -->
        <div class="tab-content" id="certs-tab">
            <div class="scrapbook-paper">
                <h2 class="section-header">ใบรับรองหลัก (Certificates Grid)</h2>
                <div style="display: flex; justify-content: center; margin-bottom: 2rem;">
                    <button class="btn btn-add" onclick="openAddCertModal()">
                        <i class="fas fa-plus"></i> เพิ่มใบรับรองใหม่ (Add Certificate)
                    </button>
                </div>
                <div class="project-grid" id="certs-list-container">
                    <!-- Loaded dynamically -->
                </div>
            </div>

            <div class="scrapbook-paper">
                <h2 class="section-header">โพลารอยด์เรียงต่อกันแถวล่าง (Bottom Polaroid Photo Strip)</h2>
                <div id="polaroid-strip-list-container">
                    <!-- Loaded dynamically as form rows -->
                </div>
            </div>
        </div>

        <!-- ==================== Tab Content: SKILLS ==================== -->
        <div class="tab-content" id="skills-tab">
            <div class="scrapbook-paper" style="border-style: dashed; border-color: var(--primary); text-align: center; padding: 2rem;">
                <h2 class="section-header" style="margin-bottom: 1rem;">ระบบจัดการทักษะทางเทคนิค (Technical Skills Manager)</h2>
                <p style="margin-bottom: 1.5rem; color: var(--text-muted);">คุณสามารถเพิ่ม แก้ไข จัดเรียง หรือลบหมวดหมู่ทักษะหลักและทักษะย่อยทั้งหมดที่จะแสดงในส่วน Technical Skills บนหน้าเว็บได้จากหน้านี้โดยตรง</p>
                <button class="btn btn-add" onclick="addNewSkillCategory()" style="margin-bottom: 0;">
                    <i class="fas fa-plus"></i> เพิ่มหมวดหมู่ทักษะหลักใหม่ (Add Skill Category)
                </button>
            </div>
            <div id="skills-list-container">
                <!-- Loaded dynamically -->
            </div>
        </div>

        <!-- ==================== Tab Content: CONTACT ==================== -->
        <div class="tab-content" id="contact-tab">
            <div class="scrapbook-paper">
                <h2 class="section-header">Contact & Postcard Details</h2>
                <div class="form-row">
                    <div class="form-group">
                        <label for="contact_email">อีเมลติดต่อ (Email)</label>
                        <input type="email" id="contact_email" placeholder="e.g. fair2708@gmail.com">
                    </div>
                    <div class="form-group">
                        <label for="contact_phone">เบอร์โทรศัพท์ (Phone)</label>
                        <input type="text" id="contact_phone" placeholder="e.g. 097-094-8781">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="contact_address_th">ที่อยู่ / พิกัด (TH)</label>
                        <input type="text" id="contact_address_th" placeholder="เช่น ปทุมธานี, ประเทศไทย">
                    </div>
                    <div class="form-group">
                        <label for="contact_address_en">Location (EN)</label>
                        <input type="text" id="contact_address_en" placeholder="e.g. Pathum Thani, Thailand">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="postcard_title_th">หัวจดหมายบนโปสการ์ด (TH)</label>
                        <input type="text" id="postcard_title_th" placeholder="เช่น ถึง: คุณ!">
                    </div>
                    <div class="form-group">
                        <label for="postcard_title_en">Postcard Title (EN)</label>
                        <input type="text" id="postcard_title_en" placeholder="e.g. To: You!">
                    </div>
                </div>
                <div class="form-group full-width">
                    <label for="postcard_text_th">คำเชิญชวนบนโปสการ์ด (TH)</label>
                    <textarea id="postcard_text_th"></textarea>
                </div>
                <div class="form-group full-width">
                    <label for="postcard_text_en">Postcard Writing Text (EN)</label>
                    <textarea id="postcard_text_en"></textarea>
                </div>
            </div>
        </div>

    </div>

    <!-- ==================== Project Form Modal ==================== -->
    <div class="editor-modal" id="project-editor-modal">
        <div class="modal-body">
            <div class="modal-header">
                <h2 class="modal-title" id="proj-modal-title">เพิ่มผลงานใหม่</h2>
                <button class="btn-close" onclick="closeProjectModal()">&times;</button>
            </div>
            <form id="project-form">
                <input type="hidden" id="proj-id">
                <div class="form-row">
                    <div class="form-group">
                        <label for="proj_title_en">Project Title (EN)</label>
                        <input type="text" id="proj_title_en" required>
                    </div>
                    <div class="form-group">
                        <label for="proj_title_th">ชื่อโปรเจกต์ (TH)</label>
                        <input type="text" id="proj_title_th" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="proj_category_en">Category Tag (EN)</label>
                        <input type="text" id="proj_category_en" required placeholder="e.g. GRADUATION PROJECT">
                    </div>
                    <div class="form-group">
                        <label for="proj_category_th">แท็กหมวดหมู่ (TH)</label>
                        <input type="text" id="proj_category_th" required placeholder="เช่น GRADUATION PROJECT">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="proj_desc_en">Short Description (EN)</label>
                        <input type="text" id="proj_desc_en" required>
                    </div>
                    <div class="form-group">
                        <label for="proj_desc_th">คำอธิบายสั้นๆ (TH)</label>
                        <input type="text" id="proj_desc_th" required>
                    </div>
                </div>
                <div class="form-group full-width">
                    <label for="proj_repo">GitHub Repository Link</label>
                    <input type="url" id="proj_repo">
                </div>
                <div class="form-group full-width">
                    <label for="proj_other_link">ลิงก์อื่นเพิ่มเติม (Other Link - e.g., Live Demo, Website, Figma)</label>
                    <input type="url" id="proj_other_link" placeholder="https://...">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="proj_other_link_label_en">Other Link Label (EN)</label>
                        <input type="text" id="proj_other_link_label_en" placeholder="e.g. Live Demo, Visit Website">
                    </div>
                    <div class="form-group">
                        <label for="proj_other_link_label_th">ป้ายชื่อลิงก์เพิ่มเติม (TH)</label>
                        <input type="text" id="proj_other_link_label_th" placeholder="เช่น ดูตัวอย่างจริง, ดูเว็บไซต์">
                    </div>
                </div>
                <div class="form-group full-width">
                    <label for="proj_tags">Tech Tags (Comma separated)</label>
                    <input type="text" id="proj_tags" required placeholder="e.g. Golang, Fiber, Firebase">
                </div>
                <div class="form-group full-width">
                    <label for="proj_readme_en">Readme Details (EN)</label>
                    <textarea id="proj_readme_en" required></textarea>
                </div>
                <div class="form-group full-width">
                    <label for="proj_readme_th">รายละเอียดฉบับเต็ม / Readme (TH)</label>
                    <textarea id="proj_readme_th" required></textarea>
                </div>
                <div class="form-group full-width">
                    <label for="proj_bullets_en">Bullet Points (EN) - One per line</label>
                    <textarea id="proj_bullets_en" required></textarea>
                </div>
                <div class="form-group full-width">
                    <label for="proj_bullets_th">จุดเด่นหลัก (TH) - หนึ่งหัวข้อต่อหนึ่งบรรทัด</label>
                    <textarea id="proj_bullets_th" required></textarea>
                </div>
                <div class="form-group full-width">
                    <label>อัปโหลดภาพประกอบเพิ่ม</label>
                    <div class="image-uploader" onclick="document.getElementById('proj-file-input').click()">
                        <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: var(--primary);"></i>
                        คลิกเพื่อเลือกภาพและอัปโหลด
                        <input type="file" id="proj-file-input" multiple accept="image/*" style="display: none;" onchange="handleProjUpload(this)">
                    </div>
                </div>
                <div class="form-group full-width">
                    <label>เลือกภาพโปรเจกต์ (รูปแรกจะแสดงเป็นรูปหน้าปกโพลารอยด์)</label>
                    <div class="image-picker-grid" id="proj-image-selector">
                        <!-- Loaded dynamically -->
                    </div>
                </div>
                <div class="submit-bar">
                    <button type="submit" class="btn btn-submit">บันทึกชั่วคราว (Save)</button>
                    <button type="button" class="btn btn-cancel" onclick="closeProjectModal()">ยกเลิก</button>
                </div>
            </form>
        </div>
    </div>

    <!-- ==================== Timeline Form Modal ==================== -->
    <div class="editor-modal" id="timeline-editor-modal">
        <div class="modal-body">
            <div class="modal-header">
                <h2 class="modal-title" id="time-modal-title">เพิ่มประวัติใหม่</h2>
                <button class="btn-close" onclick="closeTimelineModal()">&times;</button>
            </div>
            <form id="timeline-form">
                <input type="hidden" id="time-id">
                <div class="form-group">
                    <label for="time_type">ประเภท (Type)</label>
                    <select id="time_type">
                        <option value="education">การศึกษา (Education)</option>
                        <option value="work">การทำงาน (Work Experience)</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="time_title_en">Title (EN)</label>
                        <input type="text" id="time_title_en" required placeholder="e.g. Software Developer Intern">
                    </div>
                    <div class="form-group">
                        <label for="time_title_th">ตำแหน่ง / ระดับการศึกษา (TH)</label>
                        <input type="text" id="time_title_th" required placeholder="เช่น Software Developer Intern">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="time_sub_en">Institution / Company (EN)</label>
                        <input type="text" id="time_sub_en" required>
                    </div>
                    <div class="form-group">
                        <label for="time_sub_th">สถาบัน / บริษัท (TH)</label>
                        <input type="text" id="time_sub_th" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="time_date_en">Duration / Year (EN)</label>
                        <input type="text" id="time_date_en" required placeholder="e.g. Jan 2025 - Jul 2025">
                    </div>
                    <div class="form-group">
                        <label for="time_date_th">ช่วงเวลา / ปี (TH)</label>
                        <input type="text" id="time_date_th" required placeholder="เช่น ม.ค. 2025 - ก.ค. 2025">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="time_desc_en">Short Paragraph Details (EN) - Use only if no bullets</label>
                        <input type="text" id="time_desc_en" placeholder="For single-line simple descriptions...">
                    </div>
                    <div class="form-group">
                        <label for="time_desc_th">รายละเอียดอย่างย่อ (TH) - ใช้เฉพาะกรณีไม่มี bullet points</label>
                        <input type="text" id="time_desc_th" placeholder="สำหรับข้อความคำอธิบายสั้นๆ บรรทัดเดียว...">
                    </div>
                </div>
                <div class="form-group full-width">
                    <label for="time_bullets_en">Bullet Points Details (EN) - One per line (Recommended for Work)</label>
                    <textarea id="time_bullets_en" placeholder="Co-developed a comprehensive Enterprise System..."></textarea>
                </div>
                <div class="form-group full-width">
                    <label for="time_bullets_th">จุดเด่น / รายละเอียดประวัติ (TH) - หนึ่งหัวข้อต่อหนึ่งบรรทัด (แนะนำสำหรับประวัติงาน)</label>
                    <textarea id="time_bullets_th" placeholder="พัฒนา Enterprise System ขนาดใหญ่ (Full SDLC)..."></textarea>
                </div>
                <div class="submit-bar">
                    <button type="submit" class="btn btn-submit">บันทึกชั่วคราว (Save)</button>
                    <button type="button" class="btn btn-cancel" onclick="closeTimelineModal()">ยกเลิก</button>
                </div>
            </form>
        </div>
    </div>

    <!-- ==================== Cert Form Modal ==================== -->
    <div class="editor-modal" id="cert-editor-modal">
        <div class="modal-body">
            <div class="modal-header">
                <h2 class="modal-title" id="cert-modal-title">เพิ่มใบรับรองใหม่</h2>
                <button class="btn-close" onclick="closeCertModal()">&times;</button>
            </div>
            <form id="cert-form">
                <input type="hidden" id="cert-id">
                <div class="form-row">
                    <div class="form-group">
                        <label for="cert_title_en">Certificate Title (EN)</label>
                        <input type="text" id="cert_title_en" required placeholder="e.g. Gemini Certified Educator">
                    </div>
                    <div class="form-group">
                        <label for="cert_title_th">ชื่อใบรับรอง (TH)</label>
                        <input type="text" id="cert_title_th" required placeholder="เช่น Gemini Certified Educator">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="cert_desc_en">Certificate Description (EN)</label>
                        <input type="text" id="cert_desc_en" required>
                    </div>
                    <div class="form-group">
                        <label for="cert_desc_th">คำอธิบายใบรับรอง (TH)</label>
                        <input type="text" id="cert_desc_th" required>
                    </div>
                </div>
                <div class="form-group full-width">
                    <label>เลือกภาพถ่ายใบรับรอง</label>
                    <div class="image-picker-grid" id="cert-image-selector">
                        <!-- Loaded dynamically -->
                    </div>
                </div>
                <div class="submit-bar">
                    <button type="submit" class="btn btn-submit">บันทึกชั่วคราว (Save)</button>
                    <button type="button" class="btn btn-cancel" onclick="closeCertModal()">ยกเลิก</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Toast Notification -->
    <div class="toast" id="toast">บันทึกข้อมูลสำเร็จ!</div>

    <script>
        // Global State DB
        let db = {
            profile: {}, projects: [], experience: [], certifications: [], polaroid_strip: [], contact: {}
        };
        let availableImages = [];
        
        let activeTabId = 'profile-tab';
        let projSelectedImages = [];
        let certSelectedImage = '';
        let aboutSelectedImage = '';
        function setSelectValue(id, val) {
            const el = document.getElementById(id);
            if (el) el.value = val;
        }

        // Init uploader and tabs
        async function init() {
            try {
                await loadSiteData();
            } catch (e) {
                console.error("Error loading site data:", e);
            }
            try {
                await loadAvailableImages();
            } catch (e) {
                console.error("Error loading available images:", e);
            }
            try {
                populateForms();
            } catch (e) {
                console.error("Error populating forms:", e);
            }
        }
        init();

        // Switch dashboard tabs
        function switchTab(tabId, btn) {
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            
            document.getElementById(tabId).classList.add('active');
            btn.classList.add('active');
            activeTabId = tabId;
        }

        // Load complete DB from Server
        async function loadSiteData() {
            const res = await fetch('/api/site-data');
            db = await res.json();
            
            try { renderProjectsList(); } catch (e) { console.error("Error rendering projects list:", e); }
            try { renderTimelineList(); } catch (e) { console.error("Error rendering timeline list:", e); }
            try { renderCertsList(); } catch (e) { console.error("Error rendering certs list:", e); }
            try { renderPolaroidStripList(); } catch (e) { console.error("Error rendering polaroid strip list:", e); }
            try { renderSkillsList(); } catch (e) { console.error("Error rendering skills list:", e); }
        }

        async function loadAvailableImages() {
            const res = await fetch('/api/available-images');
            availableImages = await res.json();
            try { renderAboutImagePicker(); } catch (e) { console.error("Error rendering about image picker:", e); }
            try { renderHeroImagePicker(1); } catch (e) { console.error("Error rendering hero image picker 1:", e); }
            try { renderHeroImagePicker(2); } catch (e) { console.error("Error rendering hero image picker 2:", e); }
            try { renderHeroImagePicker(3); } catch (e) { console.error("Error rendering hero image picker 3:", e); }
        }

        function renderHeroImagePicker(num) {
            const picker = document.getElementById(\`hero-image-selector-\${num}\`);
            if (!picker) return;
            picker.innerHTML = '';
            const currentVal = document.getElementById(\`hero_img_\${num}\`).value;
            availableImages.forEach(img => {
                const card = document.createElement('div');
                card.className = 'image-thumb-card' + (img === currentVal ? ' selected' : '');
                card.innerHTML = \`<img src="/assets/images/\${img}" onerror="this.src='/assets/images/favicon.svg'">
                    <div class="overlay"><i class="fas fa-check"></i></div>\`;
                card.addEventListener('click', () => {
                    document.getElementById(\`hero_img_\${num}\`).value = img;
                    updateHeroPreview(num, img);
                    renderHeroImagePicker(num);
                });
                picker.appendChild(card);
            });
        }

        function updateHeroPreview(num, filename) {
            const preview = document.getElementById(\`hero-img-preview-\${num}\`);
            if (!preview) return;
            preview.style.display = 'block';
            preview.src = \`/assets/images/\${filename}\`;
            renderHeroImagePicker(num);
        }

        // Fill static forms (Profile & Contact)
        function populateForms() {
            try {
                // Profile
                document.getElementById('status_th').value = db.profile.status_th || '';
                document.getElementById('status_en').value = db.profile.status_en || '';
                document.getElementById('first_name_th').value = db.profile.first_name_th || '';
                document.getElementById('first_name_en').value = db.profile.first_name_en || '';
                document.getElementById('last_name_th').value = db.profile.last_name_th || '';
                document.getElementById('last_name_en').value = db.profile.last_name_en || '';
                document.getElementById('subtitle_th').value = db.profile.subtitle_th || '';
                document.getElementById('subtitle_en').value = db.profile.subtitle_en || '';
                document.getElementById('cv_link_th').value = db.profile.cv_link_th || '';
                document.getElementById('cv_link_en').value = db.profile.cv_link_en || '';
                document.getElementById('about_title_th').value = db.profile.about_title_th || '';
                document.getElementById('about_title_en').value = db.profile.about_title_en || '';
                document.getElementById('about_text_th').value = db.profile.about_text_th || '';
                document.getElementById('about_text_en').value = db.profile.about_text_en || '';
                document.getElementById('about_caption_th').value = db.profile.about_caption_th || '';
                document.getElementById('about_caption_en').value = db.profile.about_caption_en || '';

                aboutSelectedImage = db.profile.about_img || '';

                // Hero polaroid images
                document.getElementById('hero_img_1').value = db.profile.hero_img_1 || '';
                document.getElementById('hero_img_2').value = db.profile.hero_img_2 || '';
                document.getElementById('hero_img_3').value = db.profile.hero_img_3 || '';
                document.getElementById('hero_caption_1_th').value = db.profile.hero_caption_1_th || '';
                document.getElementById('hero_caption_1_en').value = db.profile.hero_caption_1_en || '';
                document.getElementById('hero_caption_2_th').value = db.profile.hero_caption_2_th || '';
                document.getElementById('hero_caption_2_en').value = db.profile.hero_caption_2_en || '';
                document.getElementById('hero_caption_3_th').value = db.profile.hero_caption_3_th || '';
                document.getElementById('hero_caption_3_en').value = db.profile.hero_caption_3_en || '';
                setSelectValue('hero_tape_1', db.profile.hero_tape_1 || 'tape-pink');
                setSelectValue('hero_tape_2', db.profile.hero_tape_2 || 'tape-green');
                setSelectValue('hero_tape_3', db.profile.hero_tape_3 || 'tape-yellow');
                updateHeroPreview(1, db.profile.hero_img_1 || '');
                updateHeroPreview(2, db.profile.hero_img_2 || '');
                updateHeroPreview(3, db.profile.hero_img_3 || '');
            } catch(e) {
                console.warn('populateForms profile section error:', e);
            }

            // Contact — separate try/catch so it always runs even if profile section has an error
            try {
                const c = db.contact || {};
                document.getElementById('contact_email').value = c.email || '';
                document.getElementById('contact_phone').value = c.phone || '';
                document.getElementById('contact_address_th').value = c.address_th || '';
                document.getElementById('contact_address_en').value = c.address_en || '';
                document.getElementById('postcard_title_th').value = c.postcard_title_th || '';
                document.getElementById('postcard_title_en').value = c.postcard_title_en || '';
                document.getElementById('postcard_text_th').value = c.postcard_text_th || '';
                document.getElementById('postcard_text_en').value = c.postcard_text_en || '';
            } catch(e) {
                console.warn('populateForms contact section error:', e);
            }
        }

        // ==================== Render Functions ====================

        function renderProjectsList() {
            const container = document.getElementById('projects-list-container');
            container.innerHTML = '';
            const total = db.projects.length;
            
            db.projects.forEach((p, idx) => {
                const isEven = idx % 2 === 0;
                const tiltClass = isEven ? 'tilted-left' : 'tilted-right';
                const tapeColorClass = idx % 3 === 0 ? '' : (idx % 3 === 1 ? 'tape-pink' : 'tape-yellow');
                const imageSrc = p.images[0] ? \`/assets/images/project_images/\${p.images[0]}\` : '/assets/images/favicon.svg';

                const card = document.createElement('div');
                card.className = \`polaroid-card \${tiltClass}\`;
                card.innerHTML = \`
                    <div class="tape \${tapeColorClass}"></div>
                    <img class="polaroid-img" src="\${imageSrc}" alt="\${p.title_en}">
                    <span class="proj-cat">\${p.category_en}</span>
                    <h3>\${p.title_en}</h3>
                    <p class="proj-desc">\${p.desc_en}</p>
                    <div class="card-actions">
                        <div style="display:flex; gap:0.3rem; margin-right:0.3rem;">
                            <button class="btn" style="background:rgba(124,58,237,0.08);color:var(--primary);padding:0.4rem 0.6rem;" \${idx === 0 ? 'disabled style="opacity:0.3;cursor:default;background:rgba(124,58,237,0.08);color:var(--primary);padding:0.4rem 0.6rem;"' : ''} onclick="moveProject('\${p.id}', -1)" title="ขึ้น">
                                <i class="fas fa-chevron-up"></i>
                            </button>
                            <button class="btn" style="background:rgba(124,58,237,0.08);color:var(--primary);padding:0.4rem 0.6rem;" \${idx === total - 1 ? 'disabled style="opacity:0.3;cursor:default;background:rgba(124,58,237,0.08);color:var(--primary);padding:0.4rem 0.6rem;"' : ''} onclick="moveProject('\${p.id}', 1)" title="ลง">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                        <button class="btn btn-edit" onclick="editProject('\${p.id}')">
                            <i class="fas fa-edit"></i> แก้ไข (Edit)
                        </button>
                        <button class="btn btn-delete" onclick="deleteProject('\${p.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                \`;
                container.appendChild(card);
            });
        }

        function moveProject(id, dir) {
            const idx = db.projects.findIndex(p => p.id === id);
            const newIdx = idx + dir;
            if (newIdx < 0 || newIdx >= db.projects.length) return;
            const tmp = db.projects[idx];
            db.projects[idx] = db.projects[newIdx];
            db.projects[newIdx] = tmp;
            renderProjectsList();
        }

        function renderTimelineList() {
            const container = document.getElementById('timeline-list-container');
            container.innerHTML = '';
            const total = db.experience.length;
            
            db.experience.forEach((e, idx) => {
                const isEven = idx % 2 === 0;
                const tiltClass = isEven ? 'tilted-left' : 'tilted-right';
                const tapeColorClass = e.type === 'education' ? 'tape-pink' : '';

                const card = document.createElement('div');
                card.className = \`polaroid-card \${tiltClass}\`;
                card.innerHTML = \`
                    <div class="tape \${tapeColorClass}"></div>
                    <div style="font-size: 0.75rem; font-weight: 800; color: var(--primary); margin-bottom: 0.5rem;">\${e.type.toUpperCase()}</div>
                    <h3>\${e.title_en}</h3>
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-dark); margin-bottom: 0.2rem;">\${e.subtitle_en}</div>
                    <p class="proj-desc" style="font-size: 0.8rem;">\${e.date_en}</p>
                    <div class="card-actions">
                        <div style="display:flex; gap:0.3rem; margin-right:0.3rem;">
                            <button class="btn" style="background:rgba(124,58,237,0.08);color:var(--primary);padding:0.4rem 0.6rem;" \${idx === 0 ? 'disabled style="opacity:0.3;cursor:default;background:rgba(124,58,237,0.08);color:var(--primary);padding:0.4rem 0.6rem;"' : ''} onclick="moveTimeline('\${e.id}', -1)" title="ขึ้น">
                                <i class="fas fa-chevron-up"></i>
                            </button>
                            <button class="btn" style="background:rgba(124,58,237,0.08);color:var(--primary);padding:0.4rem 0.6rem;" \${idx === total - 1 ? 'disabled style="opacity:0.3;cursor:default;background:rgba(124,58,237,0.08);color:var(--primary);padding:0.4rem 0.6rem;"' : ''} onclick="moveTimeline('\${e.id}', 1)" title="ลง">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                        <button class="btn btn-edit" onclick="editTimeline('\${e.id}')">
                            <i class="fas fa-edit"></i> แก้ไข (Edit)
                        </button>
                        <button class="btn btn-delete" onclick="deleteTimeline('\${e.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                \`;
                container.appendChild(card);
            });
        }

        function moveTimeline(id, dir) {
            const idx = db.experience.findIndex(e => e.id === id);
            const newIdx = idx + dir;
            if (newIdx < 0 || newIdx >= db.experience.length) return;
            const tmp = db.experience[idx];
            db.experience[idx] = db.experience[newIdx];
            db.experience[newIdx] = tmp;
            renderTimelineList();
        }

        function renderCertsList() {
            const container = document.getElementById('certs-list-container');
            container.innerHTML = '';
            const total = db.certifications.length;
            
            db.certifications.forEach((c, idx) => {
                const isEven = idx % 2 === 0;
                const tiltClass = isEven ? 'tilted-left' : 'tilted-right';
                const imageSrc = c.img ? \`/assets/images/\${c.img}\` : '/assets/images/favicon.svg';

                const card = document.createElement('div');
                card.className = \`polaroid-card \${tiltClass}\`;
                card.innerHTML = \`
                    <div class="tape"></div>
                    <img class="polaroid-img" src="\${imageSrc}" alt="\${c.title_en}">
                    <h3>\${c.title_en}</h3>
                    <p class="proj-desc" style="font-size: 0.8rem;">\${c.desc_en}</p>
                    <div class="card-actions">
                        <div style="display:flex; gap:0.3rem; margin-right:0.3rem;">
                            <button class="btn" style="background:rgba(124,58,237,0.08);color:var(--primary);padding:0.4rem 0.6rem;" \${idx === 0 ? 'disabled style="opacity:0.3;cursor:default;background:rgba(124,58,237,0.08);color:var(--primary);padding:0.4rem 0.6rem;"' : ''} onclick="moveCert('\${c.id}', -1)" title="ขึ้น">
                                <i class="fas fa-chevron-up"></i>
                            </button>
                            <button class="btn" style="background:rgba(124,58,237,0.08);color:var(--primary);padding:0.4rem 0.6rem;" \${idx === total - 1 ? 'disabled style="opacity:0.3;cursor:default;background:rgba(124,58,237,0.08);color:var(--primary);padding:0.4rem 0.6rem;"' : ''} onclick="moveCert('\${c.id}', 1)" title="ลง">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                        <button class="btn btn-edit" onclick="editCert('\${c.id}')">
                            <i class="fas fa-edit"></i> แก้ไข (Edit)
                        </button>
                        <button class="btn btn-delete" onclick="deleteCert('\${c.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                \`;
                container.appendChild(card);
            });
        }

        function moveCert(id, dir) {
            const idx = db.certifications.findIndex(c => c.id === id);
            const newIdx = idx + dir;
            if (newIdx < 0 || newIdx >= db.certifications.length) return;
            const tmp = db.certifications[idx];
            db.certifications[idx] = db.certifications[newIdx];
            db.certifications[newIdx] = tmp;
            renderCertsList();
        }

        function renderPolaroidStripList() {
            const container = document.getElementById('polaroid-strip-list-container');
            container.innerHTML = '';
            const total = db.polaroid_strip.length;
            
            db.polaroid_strip.forEach((p, idx) => {
                const imageSrc = p.img ? \`/assets/images/\${p.img}\` : '/assets/images/favicon.svg';
                
                const row = document.createElement('div');
                row.className = 'scrapbook-paper';
                row.style.padding = '1.5rem';
                row.style.marginBottom = '1.5rem';
                row.innerHTML = \`
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <!-- Reorder buttons -->
                        <div style="display:flex; flex-direction:column; gap:0.3rem; flex-shrink:0;">
                            <button class="btn" style="background:rgba(124,58,237,0.08);color:var(--primary);padding:0.35rem 0.5rem;\${idx === 0 ? 'opacity:0.3;cursor:default;' : ''}" \${idx === 0 ? 'disabled' : ''} onclick="moveStrip(\${idx}, -1)" title="ขึ้น">
                                <i class="fas fa-chevron-up"></i>
                            </button>
                            <button class="btn" style="background:rgba(124,58,237,0.08);color:var(--primary);padding:0.35rem 0.5rem;\${idx === total - 1 ? 'opacity:0.3;cursor:default;' : ''}" \${idx === total - 1 ? 'disabled' : ''} onclick="moveStrip(\${idx}, 1)" title="ลง">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                        <img src="\${imageSrc}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid rgba(0,0,0,0.1); flex-shrink:0;">
                        <div style="flex-grow: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group" style="padding-left:0; margin-bottom:0;">
                                <label>แคปชั่นใบที่ \${idx+1} (TH)</label>
                                <input type="text" value="\${p.caption_th}" onchange="updateStripCaption(\${idx}, 'th', this.value)">
                            </div>
                            <div class="form-group" style="padding-left:0; margin-bottom:0;">
                                <label>Caption \${idx+1} (EN)</label>
                                <input type="text" value="\${p.caption_en}" onchange="updateStripCaption(\${idx}, 'en', this.value)">
                            </div>
                            <div class="form-group" style="padding-left:0; margin-bottom:0;">
                                <label>ชื่อไฟล์รูปภาพ (Image filename)</label>
                                <input type="text" value="\${p.img}" placeholder="เช่น IMG_2835.jpeg" onchange="updateStripImage(\${idx}, this.value)">
                            </div>
                            <div class="form-group" style="padding-left:0; margin-bottom:0;">
                                <label>เทปวาชิแปะการ์ด (Washi Tape Style)</label>
                                <select onchange="updateStripTape(\${idx}, this.value)">
                                    <option value="tape-yellow" \${p.tape === 'tape-yellow' ? 'selected' : ''}>สีเหลือง (tape-yellow)</option>
                                    <option value="tape-pink" \${p.tape === 'tape-pink' ? 'selected' : ''}>สีชมพู (tape-pink)</option>
                                    <option value="tape-green" \${p.tape === 'tape-green' ? 'selected' : ''}>สีเขียว (tape-green)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                \`;
                container.appendChild(row);
            });
        }

        function moveStrip(idx, dir) {
            const newIdx = idx + dir;
            if (newIdx < 0 || newIdx >= db.polaroid_strip.length) return;
            const tmp = db.polaroid_strip[idx];
            db.polaroid_strip[idx] = db.polaroid_strip[newIdx];
            db.polaroid_strip[newIdx] = tmp;
            renderPolaroidStripList();
        }

        // Update strip helpers
        function updateStripCaption(idx, lang, val) {
            if (lang === 'th') db.polaroid_strip[idx].caption_th = val;
            if (lang === 'en') db.polaroid_strip[idx].caption_en = val;
        }
        function updateStripImage(idx, val) {
            db.polaroid_strip[idx].img = val;
            renderPolaroidStripList();
        }
        function updateStripTape(idx, val) {
            db.polaroid_strip[idx].tape = val;
        }

        // ==================== Pickers Generators ====================

        function renderAboutImagePicker() {
            const picker = document.getElementById('about-image-selector');
            picker.innerHTML = '';
            
            availableImages.forEach(img => {
                const card = document.createElement('div');
                card.className = 'image-thumb-card';
                if (img === aboutSelectedImage) {
                    card.classList.add('selected');
                }
                card.innerHTML = \`
                    <img src="/assets/images/\${img}" alt="\${img}" title="\${img}">
                    <div class="overlay"><i class="fas fa-check"></i></div>
                \`;
                card.addEventListener('click', () => {
                    aboutSelectedImage = img;
                    renderAboutImagePicker();
                });
                picker.appendChild(card);
            });
        }

        function renderProjImagePicker() {
            const picker = document.getElementById('proj-image-selector');
            picker.innerHTML = '';
            
            // Filter images inside project_images subdirectory
            availableImages.forEach(img => {
                const card = document.createElement('div');
                card.className = 'image-thumb-card';
                
                const idx = projSelectedImages.indexOf(img);
                if (idx !== -1) {
                    card.classList.add('selected');
                    const badge = document.createElement('span');
                    badge.className = 'badge';
                    badge.textContent = idx === 0 ? 'Cover' : (idx + 1);
                    card.appendChild(badge);
                }

                card.innerHTML += \`
                    <img src="/assets/images/project_images/\${img}" alt="\${img}" onerror="this.src='/assets/images/\${img}'">
                    <div class="overlay"><i class="fas fa-check"></i></div>
                \`;
                
                card.addEventListener('click', () => {
                    const sIdx = projSelectedImages.indexOf(img);
                    if (sIdx === -1) {
                        projSelectedImages.push(img);
                    } else {
                        projSelectedImages.splice(sIdx, 1);
                    }
                    renderProjImagePicker();
                });
                
                picker.appendChild(card);
            });
        }

        function renderCertImagePicker() {
            const picker = document.getElementById('cert-image-selector');
            picker.innerHTML = '';
            
            availableImages.forEach(img => {
                const card = document.createElement('div');
                card.className = 'image-thumb-card';
                if (img === certSelectedImage) {
                    card.classList.add('selected');
                }
                card.innerHTML = \`
                    <img src="/assets/images/\${img}" alt="\${img}">
                    <div class="overlay"><i class="fas fa-check"></i></div>
                \`;
                card.addEventListener('click', () => {
                    certSelectedImage = img;
                    renderCertImagePicker();
                });
                picker.appendChild(card);
            });
        }

        // ==================== Modal Controls ====================

        // Project CRUD Modals
        function openAddProjectModal() {
            document.getElementById('project-form').reset();
            document.getElementById('proj-id').value = '';
            document.getElementById('proj-modal-title').textContent = 'เพิ่มผลงานใหม่ (Add Project)';
            projSelectedImages = [];
            renderProjImagePicker();
            document.getElementById('project-editor-modal').classList.add('active');
        }
        function closeProjectModal() {
            document.getElementById('project-editor-modal').classList.remove('active');
        }
        function editProject(id) {
            const p = db.projects.find(proj => proj.id === id);
            if (!p) return;

            document.getElementById('proj-id').value = p.id;
            document.getElementById('proj_title_en').value = p.title_en || '';
            document.getElementById('proj_title_th').value = p.title_th || '';
            document.getElementById('proj_category_en').value = p.category_en || '';
            document.getElementById('proj_category_th').value = p.category_th || '';
            document.getElementById('proj_desc_en').value = p.desc_en || '';
            document.getElementById('proj_desc_th').value = p.desc_th || '';
            document.getElementById('proj_repo').value = p.repo || '';
            document.getElementById('proj_other_link').value = p.other_link || '';
            document.getElementById('proj_other_link_label_en').value = p.other_link_label_en || '';
            document.getElementById('proj_other_link_label_th').value = p.other_link_label_th || '';
            document.getElementById('proj_tags').value = p.tags ? p.tags.join(', ') : '';
            document.getElementById('proj_readme_en').value = p.readme_en || '';
            document.getElementById('proj_readme_th').value = p.readme_th || '';
            document.getElementById('proj_bullets_en').value = p.bullets_en ? p.bullets_en.join('\\n') : '';
            document.getElementById('proj_bullets_th').value = p.bullets_th ? p.bullets_th.join('\\n') : '';

            projSelectedImages = [...(p.images || [])];
            renderProjImagePicker();
            document.getElementById('proj-modal-title').textContent = 'แก้ไขผลงาน (Edit Project)';
            document.getElementById('project-editor-modal').classList.add('active');
        }
        function deleteProject(id) {
            if (!confirm('ยืนยันลบโปรเจกต์นี้?')) return;
            db.projects = db.projects.filter(p => p.id !== id);
            renderProjectsList();
            showToast('ลบโปรเจกต์สำเร็จ!');
        }

        // Timeline CRUD Modals
        function openAddTimelineModal() {
            document.getElementById('timeline-form').reset();
            document.getElementById('time-id').value = '';
            document.getElementById('time-modal-title').textContent = 'เพิ่มประวัติใหม่ (Add Timeline Item)';
            document.getElementById('timeline-editor-modal').classList.add('active');
        }
        function closeTimelineModal() {
            document.getElementById('timeline-editor-modal').classList.remove('active');
        }
        function editTimeline(id) {
            const e = db.experience.find(item => item.id === id);
            if (!e) return;

            document.getElementById('time-id').value = e.id;
            document.getElementById('time_type').value = e.type || 'work';
            document.getElementById('time_title_en').value = e.title_en || '';
            document.getElementById('time_title_th').value = e.title_th || '';
            document.getElementById('time_sub_en').value = e.subtitle_en || '';
            document.getElementById('time_sub_th').value = e.subtitle_th || '';
            document.getElementById('time_date_en').value = e.date_en || '';
            document.getElementById('time_date_th').value = e.date_th || '';
            document.getElementById('time_desc_en').value = e.description_en || '';
            document.getElementById('time_desc_th').value = e.description_th || '';
            document.getElementById('time_bullets_en').value = e.bullets_en ? e.bullets_en.join('\\n') : '';
            document.getElementById('time_bullets_th').value = e.bullets_th ? e.bullets_th.join('\\n') : '';

            document.getElementById('time-modal-title').textContent = 'แก้ไขประวัติ (Edit Timeline)';
            document.getElementById('timeline-editor-modal').classList.add('active');
        }
        function deleteTimeline(id) {
            if (!confirm('ยืนยันลบประวัตินี้?')) return;
            db.experience = db.experience.filter(e => e.id !== id);
            renderTimelineList();
            showToast('ลบประวัติสำเร็จ!');
        }

        // Certifications CRUD Modals
        function openAddCertModal() {
            document.getElementById('cert-form').reset();
            document.getElementById('cert-id').value = '';
            document.getElementById('cert-modal-title').textContent = 'เพิ่มใบรับรองใหม่ (Add Certificate)';
            certSelectedImage = '';
            renderCertImagePicker();
            document.getElementById('cert-editor-modal').classList.add('active');
        }
        function closeCertModal() {
            document.getElementById('cert-editor-modal').classList.remove('active');
        }
        function editCert(id) {
            const c = db.certifications.find(item => item.id === id);
            if (!c) return;

            document.getElementById('cert-id').value = c.id;
            document.getElementById('cert_title_en').value = c.title_en || '';
            document.getElementById('cert_title_th').value = c.title_th || '';
            document.getElementById('cert_desc_en').value = c.desc_en || '';
            document.getElementById('cert_desc_th').value = c.desc_th || '';

            certSelectedImage = c.img || '';
            renderCertImagePicker();
            document.getElementById('cert-modal-title').textContent = 'แก้ไขใบรับรอง (Edit Certificate)';
            document.getElementById('cert-editor-modal').classList.add('active');
        }
        function deleteCert(id) {
            if (!confirm('ยืนยันลบใบรับรองนี้?')) return;
            db.certifications = db.certifications.filter(c => c.id !== id);
            renderCertsList();
            showToast('ลบใบรับรองสำเร็จ!');
        }

        // ==================== File Upload Handlers ====================

        async function handleProjUpload(input) {
            const files = input.files;
            if (!files.length) return;

            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('photos', files[i]);
            }

            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const result = await res.json();
            
            if (result.success) {
                result.filenames.forEach(filename => {
                    if (!projSelectedImages.includes(filename)) {
                        projSelectedImages.push(filename);
                    }
                    if (!availableImages.includes(filename)) {
                        availableImages.push(filename);
                    }
                });
                renderProjImagePicker();
                showToast('อัปโหลดและเลือกภาพเรียบร้อย!');
            }
        }

        // ==================== Form Submits ====================

        document.getElementById('project-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('proj-id').value;
            const tags = document.getElementById('proj_tags').value.split(',').map(t => t.trim()).filter(t => t);
            
            const bullets_en = document.getElementById('proj_bullets_en').value.split('\\n').map(b => b.trim()).filter(b => b);
            const bullets_th = document.getElementById('proj_bullets_th').value.split('\\n').map(b => b.trim()).filter(b => b);

            const data = {
                id: id || 'proj_' + Date.now(),
                title_en: document.getElementById('proj_title_en').value,
                title_th: document.getElementById('proj_title_th').value,
                category_en: document.getElementById('proj_category_en').value,
                category_th: document.getElementById('proj_category_th').value,
                desc_en: document.getElementById('proj_desc_en').value,
                desc_th: document.getElementById('proj_desc_th').value,
                repo: document.getElementById('proj_repo').value,
                other_link: document.getElementById('proj_other_link').value,
                other_link_label_en: document.getElementById('proj_other_link_label_en').value,
                other_link_label_th: document.getElementById('proj_other_link_label_th').value,
                tags,
                readme_en: document.getElementById('proj_readme_en').value,
                readme_th: document.getElementById('proj_readme_th').value,
                bullets_en,
                bullets_th,
                images: projSelectedImages
            };

            if (id) {
                const idx = db.projects.findIndex(p => p.id === id);
                db.projects[idx] = data;
            } else {
                db.projects.push(data);
            }

            closeProjectModal();
            renderProjectsList();
            showToast('บันทึกโปรเจกต์ลงความจำชั่วคราวแล้ว!');
        });

        document.getElementById('timeline-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('time-id').value;
            
            const bullets_en = document.getElementById('time_bullets_en').value.split('\\n').map(b => b.trim()).filter(b => b);
            const bullets_th = document.getElementById('time_bullets_th').value.split('\\n').map(b => b.trim()).filter(b => b);

            const data = {
                id: id || 'time_' + Date.now(),
                type: document.getElementById('time_type').value,
                title_en: document.getElementById('time_title_en').value,
                title_th: document.getElementById('time_title_th').value,
                subtitle_en: document.getElementById('time_sub_en').value,
                subtitle_th: document.getElementById('time_sub_th').value,
                date_en: document.getElementById('time_date_en').value,
                date_th: document.getElementById('time_date_th').value,
                description_en: document.getElementById('time_desc_en').value,
                description_th: document.getElementById('time_desc_th').value,
                bullets_en,
                bullets_th
            };

            if (id) {
                const idx = db.experience.findIndex(item => item.id === id);
                db.experience[idx] = data;
            } else {
                db.experience.push(data);
            }

            closeTimelineModal();
            renderTimelineList();
            showToast('บันทึกประวัติลงความจำชั่วคราวแล้ว!');
        });

        document.getElementById('cert-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('cert-id').value;

            const data = {
                id: id || 'cert_' + Date.now(),
                title_en: document.getElementById('cert_title_en').value,
                title_th: document.getElementById('cert_title_th').value,
                desc_en: document.getElementById('cert_desc_en').value,
                desc_th: document.getElementById('cert_desc_th').value,
                img: certSelectedImage
            };

            if (id) {
                const idx = db.certifications.findIndex(c => c.id === id);
                db.certifications[idx] = data;
            } else {
                db.certifications.push(data);
            }

            closeCertModal();
            renderCertsList();
            showToast('บันทึกใบรับรองลงความจำชั่วคราวแล้ว!');
        });

        // ==================== Global Save & Build Website ====================

        document.getElementById('global-save-btn').addEventListener('click', async () => {
            // Collect profile static forms data
            db.profile.status_th = document.getElementById('status_th').value;
            db.profile.status_en = document.getElementById('status_en').value;
            db.profile.first_name_th = document.getElementById('first_name_th').value;
            db.profile.first_name_en = document.getElementById('first_name_en').value;
            db.profile.last_name_th = document.getElementById('last_name_th').value;
            db.profile.last_name_en = document.getElementById('last_name_en').value;
            db.profile.subtitle_th = document.getElementById('subtitle_th').value;
            db.profile.subtitle_en = document.getElementById('subtitle_en').value;
            db.profile.cv_link_th = document.getElementById('cv_link_th').value;
            db.profile.cv_link_en = document.getElementById('cv_link_en').value;
            db.profile.about_title_th = document.getElementById('about_title_th').value;
            db.profile.about_title_en = document.getElementById('about_title_en').value;
            db.profile.about_text_th = document.getElementById('about_text_th').value;
            db.profile.about_text_en = document.getElementById('about_text_en').value;
            db.profile.about_caption_th = document.getElementById('about_caption_th').value;
            db.profile.about_caption_en = document.getElementById('about_caption_en').value;
            db.profile.about_img = aboutSelectedImage;

            // Hero polaroid data
            db.profile.hero_img_1 = document.getElementById('hero_img_1').value;
            db.profile.hero_img_2 = document.getElementById('hero_img_2').value;
            db.profile.hero_img_3 = document.getElementById('hero_img_3').value;
            db.profile.hero_caption_1_th = document.getElementById('hero_caption_1_th').value;
            db.profile.hero_caption_1_en = document.getElementById('hero_caption_1_en').value;
            db.profile.hero_caption_2_th = document.getElementById('hero_caption_2_th').value;
            db.profile.hero_caption_2_en = document.getElementById('hero_caption_2_en').value;
            db.profile.hero_caption_3_th = document.getElementById('hero_caption_3_th').value;
            db.profile.hero_caption_3_en = document.getElementById('hero_caption_3_en').value;
            db.profile.hero_tape_1 = document.getElementById('hero_tape_1').value;
            db.profile.hero_tape_2 = document.getElementById('hero_tape_2').value;
            db.profile.hero_tape_3 = document.getElementById('hero_tape_3').value;

            // Collect contact postcard details
            db.contact.email = document.getElementById('contact_email').value;
            db.contact.phone = document.getElementById('contact_phone').value;
            db.contact.address_th = document.getElementById('contact_address_th').value;
            db.contact.address_en = document.getElementById('contact_address_en').value;
            db.contact.postcard_title_th = document.getElementById('postcard_title_th').value;
            db.contact.postcard_title_en = document.getElementById('postcard_title_en').value;
            db.contact.postcard_text_th = document.getElementById('postcard_text_th').value;
            db.contact.postcard_text_en = document.getElementById('postcard_text_en').value;

            // Post compiled database to server to write JSON and rebuild both HTML files
            const res = await fetch('/api/site-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(db)
            });

            if (res.ok) {
                showToast('🎉 ประกอบและบันทึกเว็บไซต์สำเร็จแล้ว! (Rebuild Finished!)');
            } else {
                alert('เกิดข้อผิดพลาดในการบันทึกและประกอบโค้ด!');
            }
        });

        function showToast(msg) {
            const toast = document.getElementById('toast');
            toast.textContent = msg;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3500);
        }

        // ==================== Technical Skills Management ====================
        function renderSkillsList() {
            const container = document.getElementById('skills-list-container');
            if (!container) return;
            container.innerHTML = '';
            
            if (!db.skills) db.skills = [];
            const totalCats = db.skills.length;

            db.skills.forEach((cat, catIdx) => {
                const card = document.createElement('div');
                card.className = 'scrapbook-paper';
                card.style.marginBottom = '2rem';
                
                // Construct skill items HTML
                let itemsHTML = '';
                if (cat.items && cat.items.length > 0) {
                    const totalItems = cat.items.length;
                    itemsHTML = cat.items.map((item, itemIdx) => {
                        return \`
                        <div style="display: flex; gap: 0.8rem; align-items: center; margin-bottom: 0.8rem; border-bottom: 1px dashed var(--glass-border); padding-bottom: 0.5rem; flex-wrap: wrap;">
                            <div style="display:flex; flex-direction:column; gap:0.2rem; flex-shrink:0;">
                                <button class="btn" style="background:rgba(124,58,237,0.05);color:var(--primary);padding:0.2rem 0.35rem;font-size:0.7rem;\${itemIdx === 0 ? 'opacity:0.3;cursor:default;' : ''}" \${itemIdx === 0 ? 'disabled' : ''} onclick="moveSkillItem(\${catIdx}, \${itemIdx}, -1)" title="ขึ้น">
                                    <i class="fas fa-chevron-up"></i>
                                </button>
                                <button class="btn" style="background:rgba(124,58,237,0.05);color:var(--primary);padding:0.2rem 0.35rem;font-size:0.7rem;\${itemIdx === totalItems - 1 ? 'opacity:0.3;cursor:default;' : ''}" \${itemIdx === totalItems - 1 ? 'disabled' : ''} onclick="moveSkillItem(\${catIdx}, \${itemIdx}, 1)" title="ลง">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            </div>
                            <div style="flex: 2; min-width: 150px;" class="form-group" style="padding-left:0; margin-bottom:0;">
                                <label style="font-size:0.7rem; margin-bottom: 0.2rem;">ชื่อทักษะ (TH)</label>
                                <input type="text" style="padding: 0.4rem; font-size: 0.85rem;" value="\${item.name_th || ''}" onchange="updateSkillItemVal(\${catIdx}, \${itemIdx}, 'name_th', this.value)">
                            </div>
                            <div style="flex: 2; min-width: 150px;" class="form-group" style="padding-left:0; margin-bottom:0;">
                                <label style="font-size:0.7rem; margin-bottom: 0.2rem;">Skill Name (EN)</label>
                                <input type="text" style="padding: 0.4rem; font-size: 0.85rem;" value="\${item.name_en || ''}" onchange="updateSkillItemVal(\${catIdx}, \${itemIdx}, 'name_en', this.value)">
                            </div>
                            <div style="flex: 1.5; min-width: 120px;" class="form-group" style="padding-left:0; margin-bottom:0;">
                                <label style="font-size:0.7rem; margin-bottom: 0.2rem;">ไอคอน (FontAwesome)</label>
                                <input type="text" style="padding: 0.4rem; font-size: 0.85rem;" value="\${item.icon || ''}" placeholder="เช่น fab fa-golang" onchange="updateSkillItemVal(\${catIdx}, \${itemIdx}, 'icon', this.value)">
                            </div>
                            <div style="flex: 1; min-width: 80px;" class="form-group" style="padding-left:0; margin-bottom:0;">
                                <label style="font-size:0.7rem; margin-bottom: 0.2rem;">รหัสสีไอคอน</label>
                                <div style="display: flex; gap: 0.3rem; align-items: center;">
                                    <input type="color" style="width: 28px; height: 28px; padding: 0; border: none; cursor: pointer;" value="\${item.color || '#7c3aed'}" onchange="updateSkillItemColor(\${catIdx}, \${itemIdx}, this.value)">
                                    <input type="text" style="padding: 0.4rem; font-size: 0.8rem; width: 80px;" value="\${item.color || ''}" placeholder="#7c3aed" onchange="updateSkillItemVal(\${catIdx}, \${itemIdx}, 'color', this.value)">
                                </div>
                            </div>
                            <button class="btn btn-delete" style="padding: 0.5rem; margin-top: 1rem;" onclick="deleteSkillItem(\${catIdx}, \${itemIdx})" title="ลบทักษะนี้">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                        \`;
                    }).join('');
                } else {
                    itemsHTML = \`<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 1rem 0;">ยังไม่มีทักษะในหมวดหมู่นี้</p>\`;
                }

                card.innerHTML = \`
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed var(--glass-border); padding-bottom: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <div style="display:flex; flex-direction:column; gap:0.2rem; flex-shrink:0;">
                                <button class="btn" style="background:rgba(124,58,237,0.08);color:var(--primary);padding:0.3rem 0.5rem;font-size:0.8rem;\${catIdx === 0 ? 'opacity:0.3;cursor:default;' : ''}" \${catIdx === 0 ? 'disabled' : ''} onclick="moveSkillCategory(\${catIdx}, -1)" title="เลื่อนขึ้น">
                                    <i class="fas fa-chevron-up"></i>
                                </button>
                                <button class="btn" style="background:rgba(124,58,237,0.08);color:var(--primary);padding:0.3rem 0.5rem;font-size:0.8rem;\${catIdx === totalCats - 1 ? 'opacity:0.3;cursor:default;' : ''}" \${catIdx === totalCats - 1 ? 'disabled' : ''} onclick="moveSkillCategory(\${catIdx}, 1)" title="เลื่อนลง">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            </div>
                            <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.4rem; color: var(--primary);">หมวดหมู่ที่ \${catIdx + 1}: \${cat.title_en || 'หมวดใหม่'}</h3>
                        </div>
                        <button class="btn btn-delete" onclick="deleteSkillCategory(\${catIdx})" style="padding: 0.6rem 1.2rem;">
                            <i class="fas fa-trash-alt"></i> ลบหมวดหมู่นี้ (Delete Category)
                        </button>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;" class="form-row">
                        <div class="form-group" style="padding-left:0; margin-bottom:0;">
                            <label>ชื่อหมวดหมู่ (TH)</label>
                            <input type="text" value="\${cat.title_th || ''}" onchange="updateSkillCategoryVal(\${catIdx}, 'title_th', this.value)">
                        </div>
                        <div class="form-group" style="padding-left:0; margin-bottom:0;">
                            <label>Category Title (EN)</label>
                            <input type="text" value="\${cat.title_en || ''}" onchange="updateSkillCategoryVal(\${catIdx}, 'title_en', this.value)">
                        </div>
                        <div class="form-group" style="padding-left:0; margin-bottom:0;">
                            <label>ไอคอนของหมวดหมู่ (FontAwesome class)</label>
                            <input type="text" value="\${cat.icon || ''}" placeholder="เช่น fa-server" onchange="updateSkillCategoryVal(\${catIdx}, 'icon', this.value)">
                        </div>
                    </div>
                    
                    <div style="margin-top: 1rem;">
                        <h4 style="font-size: 1.1rem; color: var(--text-dark); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-list"></i> ทักษะย่อยในหมวดนี้ (Skill Items)
                        </h4>
                        
                        <div id="skill-items-list-\${catIdx}">
                            \${itemsHTML}
                        </div>
                        
                        <!-- Form to Add Skill Item -->
                        <div style="background: rgba(124,58,237,0.03); border: 1px dashed var(--glass-border); padding: 1rem; border-radius: 8px; margin-top: 1.5rem; display: flex; gap: 0.8rem; align-items: flex-end; flex-wrap: wrap;">
                            <div style="flex: 2; min-width: 150px;" class="form-group" style="padding-left:0; margin-bottom:0;">
                                <label style="font-size:0.75rem;">ชื่อทักษะย่อยใหม่ (TH)</label>
                                <input type="text" id="new-item-th-\${catIdx}" style="padding: 0.4rem; font-size: 0.85rem;" placeholder="เช่น Golang">
                            </div>
                            <div style="flex: 2; min-width: 150px;" class="form-group" style="padding-left:0; margin-bottom:0;">
                                <label style="font-size:0.75rem;">New Skill Name (EN)</label>
                                <input type="text" id="new-item-en-\${catIdx}" style="padding: 0.4rem; font-size: 0.85rem;" placeholder="e.g. Golang">
                            </div>
                            <div style="flex: 1.5; min-width: 120px;" class="form-group" style="padding-left:0; margin-bottom:0;">
                                <label style="font-size:0.75rem;">ไอคอน (FontAwesome)</label>
                                <input type="text" id="new-item-icon-\${catIdx}" style="padding: 0.4rem; font-size: 0.85rem;" placeholder="fab fa-golang">
                            </div>
                            <div style="flex: 1; min-width: 80px;" class="form-group" style="padding-left:0; margin-bottom:0;">
                                <label style="font-size:0.75rem;">รหัสสีไอคอน</label>
                                <div style="display: flex; gap: 0.3rem; align-items: center;">
                                    <input type="color" id="new-item-color-picker-\${catIdx}" style="width: 28px; height: 28px; padding: 0; border: none; cursor: pointer;" value="#7c3aed" onchange="document.getElementById('new-item-color-\${catIdx}').value = this.value">
                                    <input type="text" id="new-item-color-\${catIdx}" style="padding: 0.4rem; font-size: 0.8rem; width: 80px;" placeholder="#7c3aed" value="#7c3aed">
                                </div>
                            </div>
                            <button class="btn btn-add" style="margin-bottom:0; padding: 0.5rem 1.2rem; font-size:0.85rem; height: 35px; display: inline-flex; align-items: center;" onclick="addSkillItem(\${catIdx})">
                                <i class="fas fa-plus"></i> เพิ่มทักษะ (Add)
                            </button>
                        </div>
                    </div>
                \`;
                
                container.appendChild(card);
            });
        }

        // Skill Category Helpers
        function addNewSkillCategory() {
            if (!db.skills) db.skills = [];
            const newCat = {
                id: 'skill_' + Date.now(),
                icon: 'fa-server',
                title_en: 'New Skill Category',
                title_th: 'หมวดหมู่ทักษะใหม่',
                items: []
            };
            db.skills.push(newCat);
            renderSkillsList();
            showToast('เพิ่มหมวดหมู่ทักษะใหม่แล้ว!');
        }

        function deleteSkillCategory(catIdx) {
            if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ทักษะนี้และทักษะย่อยทั้งหมดในหมวดนี้?')) {
                db.skills.splice(catIdx, 1);
                renderSkillsList();
                showToast('ลบหมวดหมู่ทักษะแล้ว!');
            }
        }

        function moveSkillCategory(catIdx, dir) {
            const newIdx = catIdx + dir;
            if (newIdx < 0 || newIdx >= db.skills.length) return;
            const tmp = db.skills[catIdx];
            db.skills[catIdx] = db.skills[newIdx];
            db.skills[newIdx] = tmp;
            renderSkillsList();
        }

        function updateSkillCategoryVal(catIdx, field, val) {
            db.skills[catIdx][field] = val;
        }

        function updateSkillItemVal(catIdx, itemIdx, field, val) {
            if (!db.skills[catIdx].items) db.skills[catIdx].items = [];
            db.skills[catIdx].items[itemIdx][field] = val;
        }

        function updateSkillItemColor(catIdx, itemIdx, val) {
            if (!db.skills[catIdx].items) db.skills[catIdx].items = [];
            db.skills[catIdx].items[itemIdx].color = val;
            renderSkillsList();
        }

        // Skill Item Helpers
        function addSkillItem(catIdx) {
            const nameThInput = document.getElementById(\`new-item-th-\${catIdx}\`);
            const nameEnInput = document.getElementById(\`new-item-en-\${catIdx}\`);
            const iconInput = document.getElementById(\`new-item-icon-\${catIdx}\`);
            const colorInput = document.getElementById(\`new-item-color-\${catIdx}\`);
            
            const nameTh = nameThInput.value.trim();
            const nameEn = nameEnInput.value.trim();
            const icon = iconInput.value.trim();
            const color = colorInput.value.trim();
            
            if (!nameTh || !nameEn) {
                alert('กรุณากรอกชื่อทักษะทั้งภาษาไทยและอังกฤษ!');
                return;
            }
            
            if (!db.skills[catIdx].items) db.skills[catIdx].items = [];
            
            const newItem = {
                name_en: nameEn,
                name_th: nameTh,
                icon: icon,
                color: color
            };
            
            db.skills[catIdx].items.push(newItem);
            renderSkillsList();
            showToast('เพิ่มทักษะย่อยสำเร็จ!');
        }

        function deleteSkillItem(catIdx, itemIdx) {
            db.skills[catIdx].items.splice(itemIdx, 1);
            renderSkillsList();
            showToast('ลบทักษะย่อยแล้ว!');
        }

        function moveSkillItem(catIdx, itemIdx, dir) {
            const newIdx = itemIdx + dir;
            if (newIdx < 0 || newIdx >= db.skills[catIdx].items.length) return;
            const tmp = db.skills[catIdx].items[itemIdx];
            db.skills[catIdx].items[itemIdx] = db.skills[catIdx].items[newIdx];
            db.skills[catIdx].items[newIdx] = tmp;
            renderSkillsList();
        }

        // Theme toggle logic in CMS
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            function updateThemeIcon(t) {
                const sun = document.getElementById('sun-icon');
                const moon = document.getElementById('moon-icon');
                if (sun && moon) {
                    if (t === 'dark') {
                        sun.style.display = 'none';
                        moon.style.display = 'inline-block';
                    } else {
                        sun.style.display = 'inline-block';
                        moon.style.display = 'none';
                    }
                }
            }
            
            // Set initial icon on load
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            updateThemeIcon(currentTheme);

            themeBtn.addEventListener('click', () => {
                const activeTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', activeTheme);
                try {
                    localStorage.setItem('theme', activeTheme);
                } catch(e) {}
                updateThemeIcon(activeTheme);
            });
        }
    </script>
</body>
</html>
`);
});

// Trigger auto-rebuild of static files from JSON on startup
try {
    console.log('🔄 Rebuilding static index.html and th.html files from website-data.json...');
    saveSiteData(getSiteData());
    console.log('✅ Static files successfully rebuilt!');
} catch (e) {
    console.error('❌ Auto-rebuild on startup failed:', e);
}

app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🎨 Warisa Portfolio CMS System is active!`);
    console.log(`👉 Open http://localhost:${PORT} in your browser`);
    console.log(`👉 View your English Resume: http://localhost:${PORT}/index.html`);
    console.log(`👉 View your Thai Resume: http://localhost:${PORT}/th.html`);
    console.log(`==================================================\n`);
});
