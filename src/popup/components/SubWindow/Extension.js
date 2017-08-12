import React, { Component } from 'react';
import styled from 'styled-components';
import { Extensiony, Launchy, Switchy, Removy, Optioney, Chromey } from '../../../icons';
import { ajax, promisedGet, getChromeVersion, GL, capFirst, getString, sendMessage } from '../../../utils';
import TimeAgo from 'timeago-react';

const ExtensionDiv = styled.div`
	width: 100%;
	height: 100%;
	position: relative;
	cursor: initial;
	display: ${props => props.display || 'block'};
  overflow-y: scroll;
	&::-webkit-scrollbar-track{
		background: white;
	}
	&::-webkit-scrollbar{
		width: 5px;
	}
	&::-webkit-scrollbar-thumb{
		background: ${props => window.shared.themeMainColor};
  }
  a{
		color: ${props => window.shared.themeMainColor} !important;
  }
  #actions{
    margin-top: 16px;
    margin-left: 16px;
    width: 100%;
    #icon{
      cursor: pointer;
      float: left;
      width: 80px;
      height: 80px;
      display: block;
      img{
        width: 100%;
      }
    }
    svg{
      cursor: pointer;
      float: left;
      width: 60px;
      height: 60px;
      margin-top: 20px;
      margin-left: 40px;
      & + svg{
        margin-left: 10px;
      }
    }
  }
  #title{
    font-size: 30px;
    display: block;
    width: 574px;
    margin: auto;
    text-decoration: none;
    color: ${props => shared.themeMainColor};
    height: 35px;
    border-bottom: 1px solid ${props => shared.themeMainColor};
    clear: left;
  }
  #appBrief, #appDetail{
    width: 95%;
    margin: auto;
    font-size: 1.2em;
    table-layout: fixed;
    tbody{
      tr{
        td{
          ul{
            padding-left: 0px;
            li{
              list-style-type: none;
            }
          }
          word-wrap: break-word;
          padding: 5px;
          &:nth-child(1){
            width: 100px;
          }
        }
      }
    }
  }
  #detailText{
    margin-left: 18px;
  }
`;

class Extension extends Component{
	constructor(props) {
		super(props);
		this.state = {
			crxUrl: '',
			crxVersion: '',
			rating: '? / 5',
			extensionWeb: { tags: [], upVotes: 0, downVotes: 0 },
			tags: {},
			joinCommunity: false,
			userId: 'notBelloed',
		};
	}
	async componentDidMount() {
		const id = this.props.id;
		const joinCommunity = await promisedGet('joinCommunity');
		let data;
		if (joinCommunity) {
			this.setState({ joinCommunity });
			const userId = await promisedGet('userId');
			this.setState({ userId });
			data = await ajax({
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify({ userId, appId: id }),
				url:'https://ainoob.com/api/nooboss/app'
			});
			data = JSON.parse(data);
			const tags = {};
			for (let i = 0; i < data.tags.length; i++) {
				tags[data.tags[i].tag] = data.tags[i].tagged;
			}
			this.setState({ extensionWeb: data.extension, tags });
		}
		data = await ajax({
			url: 'https://clients2.google.com/service/update2/crx?prodversion=' + getChromeVersion() + '&x=id%3D' + id + '%26installsource%3Dondemand%26uc'
		});
		const crxUrl = data.match('codebase=\"\([^ ]*)\"')[1];
    const crxVersion = data.slice(20).match('version=\"\([^ ]*)\"')[1];
    const crxName = crxUrl.substr(crxUrl.lastIndexOf('/') + 1);
    console.log(data);
		this.setState({ crxUrl, crxVersion, crxName });
		data = await ajax({
			url: 'https://chrome.google.com/webstore/detail/'+id,
		});
		const rating = parseFloat(data.match(/g:rating_override=\"([\d.]*)\"/)[1]).toFixed(3)+' / 5';
		this.setState({ rating });
	}
	toggleTag() {
	}
	render() {
    const extension = this.props.extension;
		if (!extension || !this.props.icons[extension.icon]) {
			return <ExtensionDiv display='flex'><Extensiony id="loader" color={shared.themeMainColor} /></ExtensionDiv>;
    }
		let switchyRGBA = undefined;
		if (!extension.enabled) {
			switchyRGBA = 'rgba(-155,-155,-155,-0.8)';
		}
		let launchy, switchy, optioney, removy, chromey;
    if(extension.isApp) {
      launchy=<Launchy onClick={sendMessage.bind(null, { job: 'launchApp', id: extension.id }, ()=>{})} color={shared.themeMainColor} />;
    }
		if (extension.type != 'theme') {
			switchy = <Switchy onClick={() => {
				sendMessage({ job: 'extensionToggle', id: extension.id }, ()=>{})
			}} color={shared.themeMainColor} changeRGBA={switchyRGBA} />;
		}
		if (extension.optionsUrl && extension.optionsUrl.length > 0) {
			optioney = <Optioney onClick={sendMessage.bind(null, { job: 'extensionOptions', id: extension.id }, ()=>{})} color={shared.themeMainColor} />;
		}
		removy = <Removy onClick={sendMessage.bind(null, { job: 'extensionRemove', id: extension.id }, ()=>{})} color={shared.themeMainColor} />;
    chromey = <Chromey onClick={sendMessage.bind(null, { job: 'extensionBrowserOptions', id: extension.id }, ()=>{})} color={shared.themeMainColor} />;
    let launchType = null;
    if(extension.launchType) {
      launchType=<tr><td>{GL('launch_type')}</td><td>{extension.launchType}</td></tr>
    }
    let  permissions = null;
    const permissionList = (extension.permissions || []).map((elem,index) => {
      return <li key={index}>{elem}</li>;
    });
    permissions = <tr><td>{GL('permissions')}</td><td><ul>{permissionList}</ul></td></tr>;
    let hostPermissions = null;
    const hostPermissionList = (extension.hostPermissions || []).map((elem,index) => {
      return <li key={index}>{elem}</li>
    });
    hostPermissions = <tr><td>{GL('host_permissions')}</td><td><ul>{hostPermissionList}</ul></td></tr>;
    const manifestUrl='chrome-extension://'+extension.id+'/manifest.json';
    return (
      <ExtensionDiv>
        <div id="actions">
          <a id="icon" title={'https://chrome.google.com/webstore/detail/'+extension.id} target="_blank" href={'https://chrome.google.com/webstore/detail/'+extension.id}><img src={this.props.icons[extension.icon]} /></a>
          {launchy}
          {switchy}
          {optioney}
          {removy}
          {chromey}
        </div>
        <a id="title" title={'https://chrome.google.com/webstore/detail/'+extension.id} target="_blank" href={'https://chrome.google.com/webstore/detail/'+extension.id}>{extension.name}</a>
        <table id="appBrief">
          <tbody>
            <tr><td>{GL('version')}</td><td>{extension.version}</td></tr>
            <tr><td>{GL('state')}</td><td>{capFirst(extension.state || (extension.enabled ? GL('enabled') : GL('disabled')))}</td></tr>
            <tr><td>{GL('official_rating')}</td><td>{this.state.rating}</td></tr>
            <tr><td>{GL('description')}</td><td>{extension.description}</td></tr>
          </tbody>
        </table>
        <h2 id="detailText">{GL('detail')}</h2>
        <table id="appDetail">
          <tbody>
            <tr><td>{GL('last_update')}</td><td><TimeAgo datetime={extension.lastUpdateDate} locale={this.props.language} /></td></tr>
            <tr><td>{GL('first_installed')}</td><td><TimeAgo datetime={extension.installedDate} locale={this.props.language} /></td></tr>
            <tr><td>{GL('enabled')}</td><td>{capFirst(extension.enabled)}</td></tr>
            <tr><td>{GL('homepage_url')}</td><td><a title={extension.homepageUrl} target="_blank" href={extension.homepageUrl}>{extension.homepageUrl}</a></td></tr>
            <tr><td>{GL('id')}</td><td>{extension.id}</td></tr>
            <tr><td>{GL('short_name')}</td><td>{extension.shortName}</td></tr>
            <tr><td>{GL('type')}</td><td>{capFirst(extension.type)}</td></tr>
            {launchType}
            <tr><td>{GL('offline_enabled')}</td><td>{capFirst(getString(extension.offlineEnabled))}</td></tr>
            <tr><td>{GL('download_crx')}</td><td><a title={this.state.crxUrl} target="_blank" href={this.state.crxUrl}>{this.state.crxName}</a></td></tr>
            <tr><td>{capFirst('update_url')}</td><td><a title={extension.updateUrl} target="_blank" href={extension.updateUrl}>{extension.updateUrl}</a></td></tr>
            <tr><td>{capFirst('manifest_file')}</td><td><a target="_blank" onClick={sendMessage.bind(null, { job: 'openManifest', id: extension.id }, ()=>{})} href={manifestUrl} title={manifestUrl}>manifest.json</a></td></tr>
            <tr><td>{capFirst('may_disable')}</td><td>{capFirst(getString(extension.mayDisable))}</td></tr>
            <tr><td>{capFirst('install_type')}</td><td>{capFirst(extension.installType)}</td></tr>
            {hostPermissions}
            {permissions}
          </tbody>
        </table>
      </ExtensionDiv>
    );















    let launch = null;
    if(extension.isApp) {
      launch=<Launchy onClick={sendMessage.bind(null, { job: 'launchApp', id: extension.id })} />;
    }

    let toggle = null;
    if(extension.type && !extension.type.match('theme')) {
        toggle = <label onClick={CW.bind(null,this.toggleState,'Manage','switch','')} className="app-switch"></label>;
    }
    let chromeOption = null;
    chromeOption = <label title="default Chrome manage page" onClick={CLR.bind(null,'chrome://extensions/?id='+extension.id,'Manage','chromeOption','')} className="app-chromeOption"></label>;
    let config = null;
    if(extension.state != 'removed') {
      config = (
        <div className="config">
          <input type="checkbox" className="app-status-checkbox" readOnly  checked={(extension.enabled)} />
          {toggle}
          {options}
          <label onClick={CW.bind(null,this.uninstall,'Manage','uninstall','')} className="app-remove"></label>
          {chromeOption}
        </div>
      );
    }
    else {
      config = (
        <div className="config">
          <a onClick={CL.bind(null,'https://chrome.google.com/webstore/detail/'+extension.id,'App','app-link')} title={'https://chrome.google.com/webstore/detail/'+extension.id}><label className='app-add'></label></a>
        </div>
      );
    }
    let crxName=null;
    if(this.state.crxVersion) {
      crxName = 'extension_' + (this.state.crxVersion.replace(/\./g,'_') + '.crx');
    }
    const nb_rating=<tr><td>{'NB-Rating'}</td><td>{this.state.nb_rating}</td></tr>;
    let tags=null;
    if(this.state.joinCommunity) {
      const extensionWeb = this.state.extensionWeb || { tags: [], upVotes: 0, downVotes: 0 };
      const active = {};
      const temp = Object.keys(this.state.tags || {});
      for(let j = 0; j < temp.length; j++) {
        if(this.state.tags[temp[j]]) {
          active[temp[j]] = 'active';
        }
      }
      const tags=(
        <div className="tags">
          <div className="tagColumn">
            <div onClick={this.toggleTag.bind(this,'useful')} className={"tag wtf "+active['useful']}>{GL('useful')}<br />{extensionWeb.tags['useful']||0}</div>
            <div onClick={this.toggleTag.bind(this,'working')} className={"tag wtf "+active['working']}>{GL('working')}<br />{extensionWeb.tags['working']||0}</div>
          </div>
          <div className="tagColumn">
            <div onClick={this.toggleTag.bind(this,'laggy')} className={"tag soso "+active['laggy']}>{GL('laggy')}<br />{extensionWeb.tags['laggy']||0}</div>
            <div onClick={this.toggleTag.bind(this,'buggy')} className={"tag soso "+active['buggy']}>{GL('buggy')}<br />{extensionWeb.tags['buggy']||0}</div>
          </div>
          <div className="tagColumn">
            <div onClick={this.toggleTag.bind(this,'not_working')} className={"tag bad "+active['not_working']}>{GL('not_working')}<br />{extensionWeb.tags['not_working']||0}</div>
            <div onClick={this.toggleTag.bind(this,'ASM')} className={"tag bad "+active['ASM']}>{GL('ASM')}<br />{extensionWeb.tags['ASM']||0}</div>
          </div>
        </div>
      );
		}
	}
}

export default Extension;