# Material Flow

__由于本人将博客系统转到hugo上，本Hexo主题将只进行bug修复__   
安利一发我为hugo写的相同风格的主题： [YAMT](https://github.com/stkevintan/sfork)


Yet Another Material-Design-Style Hexo Theme.[DEMO](https://kntan.coding.me/kntan/)  

<div>
<img width="75%" src='https://raw.githubusercontent.com/stkevintan/hexo-theme-material-flow/master/snapshots/index.png' />
<img width="20%" src='https://raw.githubusercontent.com/stkevintan/hexo-theme-material-flow/master/snapshots/phone.png' />
</div>

## Installation
```bash
# change to work dir
cd /your_blog_dir/
# install dependencies
npm i -S hexo-generator-search hexo-generator-feed hexo-renderer-less hexo-autoprefixer hexo-generator-json-content
# download source
git clone https://github.com/stkevintan/hexo-theme-material-flow themes/material-flow
```

## Configuration
1. Change the value of `theme` to `material-flow` in `_config.yml`.
2. Put your avatar && favicon  images to `source/images/`.
3. Edit `_config.yml` and `themes/material-flow/_config.yml` for your needs.  


Here are some examples: 
1. [_config.yml](https://github.com/stkevintan/hexo/blob/master/_config.yml)  
2. [themes/material-flow/_config.yml](https://github.com/stkevintan/hexo/blob/master/themes/material-flow/_config.yml)  

## PJAX

PJAX navigation is configured in `themes/material-flow/_config.yml`:

```yaml
pjax:
  enable: true
  # Leave empty to generate the URL from advanced.cdn.type.
  script: ''
```

When `script` is empty the theme generates the PJAX script URL from
`advanced.cdn.type`:

| `advanced.cdn.type` | Generated script |
| --- | --- |
| `local` | `/js/pjax.min.js` (bundled with the theme) |
| `jsdelivr` | `https://cdn.jsdelivr.net/npm/pjax@0.2.8/pjax.min.js` |
| `unpkg` | `https://unpkg.com/pjax@0.2.8/pjax.min.js` |
| `custom` | **Required**; set `pjax.script` explicitly |

Add `data-no-pjax` to a link to keep its default full-page navigation
behavior.

## More 
Please refer to offical doc : <https://hexo.io/docs/index.html>
