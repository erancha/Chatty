import React from 'react';
import { connect } from 'react-redux';
import { toggleOverview, IToggleOverview, toggleMenu, IToggleMenu } from '../redux/mnu/actions';
import { loginWithGoogle, checkAuthStatus, logoutUser } from '../redux/auth/actions';
import { toggleTimeFilter, IToggleTimeFilter } from '../redux/msg/actions';
import { AppState } from '../redux/store/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { UserCircle, LogIn, Timer, BookOpenText } from 'lucide-react';
import { AuthContextProps, useAuth } from 'react-oidc-context';

interface MenuProps {
  showOverview: boolean;
  toggleOverview: (show: boolean) => IToggleOverview;
  menuOpen: boolean;
  toggleMenu: (isOpen: boolean) => IToggleMenu;
  timeFilterVisible: boolean;
  toggleTimeFilter: (isVisible: boolean) => IToggleTimeFilter;
  isAuthenticated: boolean;
  loginWithGoogle: (auth: AuthContextProps) => void;
  checkAuthStatus: (auth: AuthContextProps) => void;
  logoutUser: (auth: AuthContextProps) => void;
}

// Functional component to wrap the class component
export const Menu = (props: MenuProps) => {
  const auth = useAuth();
  return <ReduxConnectedMenu {...props} auth={auth} />;
};

class ReduxConnectedMenu extends React.Component<MenuProps & { auth: AuthContextProps }> {
  async componentDidMount() {
    setTimeout(() => {
      if (!this.props.isAuthenticated) this.props.toggleMenu(true);
    }, 1000);
  }

  componentDidUpdate(prevProps: MenuProps) {
    if (prevProps.isAuthenticated !== this.props.isAuthenticated) {
      this.props.checkAuthStatus(this.props.auth);
    }
  }

  render() {
    const { auth } = this.props;
    return (
      <DropdownMenu open={this.props.menuOpen} onOpenChange={(isOpen: boolean) => this.props.toggleMenu(isOpen)}>
        <DropdownMenuTrigger className={`menu-trigger${this.props.isAuthenticated ? ' authenticated' : ''}`}>
          <div className='menu-icon' title={this.props.isAuthenticated ? this.props.auth.user?.profile.name : ''}>
            <div className='menu-icon-line'></div>
            <div className='menu-icon-line'></div>
            <div className='menu-icon-line'></div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='menu-content'>
          <div className='menu-content-inner'>
            {this.props.isAuthenticated && (
              <p className='sign-out-user-details'>
                {this.props.auth.user?.profile.name} : {this.props.auth.user?.profile.email}
              </p>
            )}
            <div>
              {!this.props.isAuthenticated ? (
                <DropdownMenuItem className='menu-item'>
                  <div onClick={() => this.props.loginWithGoogle(auth)} className='app-menu-item'>
                    <span>Sign In with Google</span>
                    <UserCircle size={20} />
                    <LogIn size={20} />
                  </div>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className='menu-item' onClick={() => this.props.logoutUser(auth)}>
                  <div className='app-menu-item'>
                    <span>Sign Out</span>
                    <UserCircle size={20} />
                  </div>
                </DropdownMenuItem>
              )}
            </div>
            {this.props.isAuthenticated ? (
              <DropdownMenuItem className='menu-item' onClick={() => this.props.toggleTimeFilter(!this.props.timeFilterVisible)}>
                <div className='app-menu-item'>
                  <span>{this.props.timeFilterVisible ? 'Hide Time Filter' : 'Show Time Filter'}</span>
                  <Timer size={20} />
                </div>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className='menu-item' onClick={() => this.props.toggleOverview(!this.props.showOverview)}>
                <div className='app-menu-item'>
                  <span>{`${this.props.showOverview ? 'Hide' : 'Show'} Overview`}</span>
                  <BookOpenText size={20} />
                </div>
              </DropdownMenuItem>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  showOverview: state.mnu.showOverview,
  menuOpen: state.mnu.menuOpen,
  isAuthenticated: state.auth.isAuthenticated,
  authenticatedUsername: state.auth.username,
  timeFilterVisible: state.msg.timeFilterVisible,
});

const mapDispatchToProps = {
  toggleOverview,
  toggleMenu,
  toggleTimeFilter,
  loginWithGoogle,
  checkAuthStatus,
  logoutUser,
};

// Export the wrapper as the default export
export default connect(mapStateToProps, mapDispatchToProps)(Menu);
