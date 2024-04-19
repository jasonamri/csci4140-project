import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { fetchDBStatus } from '../actions/databaseActions';

class Home extends Component {
  componentDidMount() {
    const { fetchDBStatus } = this.props;
    fetchDBStatus();
  }

  render() {
    const { status } = this.props;

    return (
      <div>
        <div className="container">
          {status === undefined ? (
            'Connecting to database ...'
          ) : (
            <div
              className={status === true ? 'led-green' : 'led-red'}
              style={{ display: 'inline-block' }}
            />
          )}
          {status !== undefined &&
            (status === false
              ? 'Database connection failed'
              : 'Database connection successful')}
        </div>
      </div>
    );
  }
}

Home.propTypes = {
  fetchDBStatus: PropTypes.func.isRequired,
  status: PropTypes.bool,
};

Home.defaultProps = {
  status: undefined,
};

const mapStateToProps = (state) => ({ status: state.db.status });

export default connect(mapStateToProps, { fetchDBStatus })(Home);
